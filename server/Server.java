import com.sun.net.httpserver.HttpServer;
import com.sun.net.httpserver.HttpExchange;
import java.net.InetSocketAddress;
import java.net.URLDecoder;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 咖啡店后端（JDK 17 自带 HttpServer，不需要任何第三方库）
 *
 *   静态网页：/coffee-site/... 、/每次学习知识清单整理/...
 *   接口：
 *     GET  /api/health          看看服务器活着没
 *     POST /api/register        注册（前端先算好盐和哈希，服务器只存不算）
 *     GET  /api/salt?name=xxx   取某个账号的盐（登录时前端要用它算哈希）
 *     POST /api/login           登录（比对哈希）
 *     GET  /api/users?key=xxx   站长拉取完整名单（要密钥）
 *     GET  /api/orders          咖啡订单
 *     POST /api/orders          下单
 *
 * 跑法：cd server  ->  javac Server.java  ->  java Server
 */
public class Server {

    /* 端口：默认 8080。免费云平台（Render 之类）会用环境变量 PORT 指定，
       所以这里先读环境变量，读不到再用 8080。 */
    static final int PORT = readPort();

    static int readPort() {
        String env = System.getenv("PORT");
        if (env != null && !env.isBlank()) {
            try { return Integer.parseInt(env.trim()); } catch (NumberFormatException ignored) {}
        }
        return 8080;
    }

    /* 站长的后台密钥：优先读环境变量 ADMIN_KEY，其次读 admin.key 文件。
       admin.key 已写进 .gitignore，不会跟着代码上传。 */
    static final String ADMIN_KEY = loadAdminKey();

    static String loadAdminKey() {
        String env = System.getenv("ADMIN_KEY");
        if (env != null && !env.isBlank()) return env.trim();
        try {
            Path keyFile = Paths.get("admin.key");
            if (Files.exists(keyFile)) {
                String s = Files.readString(keyFile, StandardCharsets.UTF_8).trim();
                if (!s.isBlank()) return s;
            }
        } catch (Exception ignored) {}
        return "lanmeng-admin-2026";   /* 兜底：部署前请务必换掉 */
    }

    static final Path ROOT   = Paths.get("..").toAbsolutePath().normalize();
    static final Path ORDERS = Paths.get("orders.jsonl");
    static final Path USERS  = Paths.get("users.jsonl");

    public static void main(String[] args) throws Exception {
        HttpServer server = HttpServer.create(new InetSocketAddress(PORT), 0);

        server.createContext("/api/", Server::handleApi);
        server.createContext("/", Server::handleStatic);

        server.start();
        System.out.println("服务器已启动（端口 " + PORT + "）");
        System.out.println("  网站：http://127.0.0.1:" + PORT + "/coffee-site/index.html");
        System.out.println("  后台：http://127.0.0.1:" + PORT + "/coffee-site/admin.html");
        System.out.println("  接口：http://127.0.0.1:" + PORT + "/api/health");
    }

    /* ==================== 接口 ==================== */
    static void handleApi(HttpExchange ex) throws IOException {
        String path = ex.getRequestURI().getPath();
        String method = ex.getRequestMethod();

        if (method.equals("OPTIONS")) { preflight(ex); return; }

        if (path.equals("/api/health")) {
            send(ex, 200, "{\"ok\":true}");
            return;
        }

        if (path.equals("/api/register") && method.equals("POST")) {
            register(ex);
            return;
        }

        if (path.equals("/api/salt") && method.equals("GET")) {
            salt(ex);
            return;
        }

        if (path.equals("/api/login") && method.equals("POST")) {
            login(ex);
            return;
        }

        if (path.equals("/api/users") && method.equals("GET")) {
            users(ex);
            return;
        }

        if (path.equals("/api/orders")) {
            orders(ex, method);
            return;
        }

        send(ex, 404, "{\"error\":\"没有这个接口\"}");
    }

    /* 注册：前端把 name / salt / hash / contact / email / time / device 一起发来 */
    static void register(HttpExchange ex) throws IOException {
        String body = readBody(ex);
        String name = field(body, "name");
        String salt = field(body, "salt");
        String hash = field(body, "hash");

        if (name == null || name.isBlank() || salt == null || hash == null) {
            send(ex, 400, "{\"error\":\"缺少字段\"}");
            return;
        }
        if (findLine(name) != null) {
            send(ex, 409, "{\"error\":\"这个名字已经有人用了\"}");
            return;
        }

        String line = "{\"name\":\"" + esc(name) + "\","
                    + "\"salt\":\"" + esc(salt) + "\","
                    + "\"hash\":\"" + esc(hash) + "\","
                    + "\"contact\":\"" + esc(orEmpty(field(body, "contact"))) + "\","
                    + "\"email\":\"" + esc(orEmpty(field(body, "email"))) + "\","
                    + "\"time\":\"" + esc(orEmpty(field(body, "time"))) + "\","
                    + "\"device\":\"" + esc(orEmpty(field(body, "device"))) + "\"}";

        Files.writeString(USERS, line + "\n", StandardCharsets.UTF_8,
                StandardOpenOption.CREATE, StandardOpenOption.APPEND);

        send(ex, 201, "{\"ok\":true}");
    }

    /* 盐：前端登录时要用它把密码算成哈希 */
    static void salt(HttpExchange ex) throws IOException {
        String name = query(ex, "name");
        String line = name == null ? null : findLine(name);
        if (line == null) {
            send(ex, 404, "{\"error\":\"没有这个账号\"}");
            return;
        }
        send(ex, 200, "{\"salt\":\"" + esc(field(line, "salt")) + "\"}");
    }

    /* 登录：比对哈希，密码原文从不上传 */
    static void login(HttpExchange ex) throws IOException {
        String body = readBody(ex);
        String name = field(body, "name");
        String hash = field(body, "hash");

        if (name == null || hash == null) {
            send(ex, 400, "{\"error\":\"缺少字段\"}");
            return;
        }

        String line = findLine(name);
        if (line == null || !hash.equals(field(line, "hash"))) {
            send(ex, 401, "{\"error\":\"用户名或密码不对\"}");
            return;
        }

        send(ex, 200, "{\"ok\":true}");
    }

    /* 站长拉名单：必须带密钥 */
    static void users(HttpExchange ex) throws IOException {
        if (!ADMIN_KEY.equals(query(ex, "key"))) {
            send(ex, 403, "{\"error\":\"密钥不对\"}");
            return;
        }

        String all = Files.exists(USERS) ? Files.readString(USERS, StandardCharsets.UTF_8) : "";
        StringBuilder sb = new StringBuilder("[");
        boolean first = true;
        for (String line : all.split("\n")) {
            if (line.isBlank()) continue;
            if (!first) sb.append(",");
            sb.append(line.trim());
            first = false;
        }
        sb.append("]");
        send(ex, 200, sb.toString());
    }

    /* 咖啡订单（原来就有的） */
    static void orders(HttpExchange ex, String method) throws IOException {
        if (method.equals("POST")) {
            String body = readBody(ex);
            String line = body.replace("\r", " ").replace("\n", " ");
            Files.writeString(ORDERS, line + "\n", StandardCharsets.UTF_8,
                    StandardOpenOption.CREATE, StandardOpenOption.APPEND);
            send(ex, 201, "{\"ok\":true}");
            return;
        }

        if (method.equals("GET")) {
            String all = Files.exists(ORDERS) ? Files.readString(ORDERS, StandardCharsets.UTF_8) : "";
            StringBuilder sb = new StringBuilder("[");
            boolean first = true;
            for (String line : all.split("\n")) {
                if (line.isBlank()) continue;
                if (!first) sb.append(",");
                sb.append(line.trim());
                first = false;
            }
            sb.append("]");
            send(ex, 200, sb.toString());
            return;
        }

        send(ex, 405, "{\"error\":\"只支持 GET 和 POST\"}");
    }

    /* ==================== 静态网页 ==================== */
    static void handleStatic(HttpExchange ex) throws IOException {
        if (ex.getRequestMethod().equals("OPTIONS")) { preflight(ex); return; }

        String raw = ex.getRequestURI().getPath();
        if (raw.equals("/")) {
            redirect(ex, "/coffee-site/index.html");
            return;
        }

        String path = URLDecoder.decode(raw, StandardCharsets.UTF_8);
        Path file = ROOT.resolve(path.substring(1)).normalize();

        if (!file.startsWith(ROOT) || !Files.isRegularFile(file)) {
            send(ex, 404, "{\"error\":\"文件不存在\"}");
            return;
        }

        byte[] bytes = Files.readAllBytes(file);
        ex.getResponseHeaders().add("Content-Type", typeOf(file.toString()) + "; charset=utf-8");
        ex.sendResponseHeaders(200, bytes.length);
        try (OutputStream os = ex.getResponseBody()) { os.write(bytes); }
    }

    static String typeOf(String name) {
        String n = name.toLowerCase();
        if (n.endsWith(".html")) return "text/html";
        if (n.endsWith(".css"))  return "text/css";
        if (n.endsWith(".js"))   return "application/javascript";
        if (n.endsWith(".json")) return "application/json";
        if (n.endsWith(".png"))  return "image/png";
        if (n.endsWith(".jpg") || n.endsWith(".jpeg")) return "image/jpeg";
        if (n.endsWith(".gif"))  return "image/gif";
        if (n.endsWith(".svg"))  return "image/svg+xml";
        if (n.endsWith(".mp3"))  return "audio/mpeg";
        if (n.endsWith(".mp4"))  return "video/mp4";
        return "application/octet-stream";
    }

    /* ==================== 小工具 ==================== */
    static String readBody(HttpExchange ex) throws IOException {
        return new String(ex.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
    }

    static String field(String json, String key) {
        if (json == null) return null;
        Matcher m = Pattern.compile("\"" + key + "\"\\s*:\\s*\"((?:[^\"\\\\]|\\\\.)*)\"").matcher(json);
        return m.find() ? m.group(1) : null;
    }

    static String query(HttpExchange ex, String key) {
        String q = ex.getRequestURI().getRawQuery();
        if (q == null) return null;
        for (String pair : q.split("&")) {
            String[] kv = pair.split("=", 2);
            if (kv.length == 2 && kv[0].equals(key)) {
                return URLDecoder.decode(kv[1], StandardCharsets.UTF_8);
            }
        }
        return null;
    }

    static String findLine(String name) throws IOException {
        if (!Files.exists(USERS)) return null;
        for (String line : Files.readAllLines(USERS, StandardCharsets.UTF_8)) {
            if (line.isBlank()) continue;
            if (name.equals(field(line, "name"))) return line;
        }
        return null;
    }

    static String orEmpty(String s) { return s == null ? "" : s; }

    static String esc(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"")
                .replace("\r", " ").replace("\n", " ");
    }

    static void preflight(HttpExchange ex) throws IOException {
        ex.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
        ex.getResponseHeaders().add("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        ex.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type");
        ex.sendResponseHeaders(204, -1);
        ex.close();
    }

    static void redirect(HttpExchange ex, String to) throws IOException {
        ex.getResponseHeaders().add("Location", to);
        ex.sendResponseHeaders(302, -1);
        ex.close();
    }

    static void send(HttpExchange ex, int code, String json) throws IOException {
        byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
        ex.getResponseHeaders().add("Content-Type", "application/json; charset=utf-8");
        ex.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
        ex.getResponseHeaders().add("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        ex.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type");
        ex.sendResponseHeaders(code, bytes.length);
        try (OutputStream os = ex.getResponseBody()) { os.write(bytes); }
    }
}
