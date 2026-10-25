# Supabase 反向代理（Cloudflare Pages）

用途：某些网络会重置 `*.supabase.co` 的 TLS 连接。这个 Pages 项目把 `/rest/v1/*` 转发到 Supabase，域名是 `*.pages.dev`，通常能绕过域名级阻断。

## 部署

1. 登录 https://dash.cloudflare.com/ （免费账号即可）。
2. 左侧 **Workers & Pages** → **Create** → **Pages** → **Upload assets**。
3. 新建文件夹，把本目录的 `_worker.js` 和 `index.html` 放进去，拖进去上传。
4. 部署完会得到一个网址，例如 `https://coffee-proxy.pages.dev`。
5. 把网址填到 `coffee-site/js/config.js`：

   ```js
   window.SUPABASE_PROXY = "https://coffee-proxy.pages.dev";
   ```

6. 保存并刷新，注册 / 登录 / 钱包就会走这个代理。

## 注意

- 只代理 `/rest/v1/`；不碰密码原文，传的仍然是哈希。
- 不要把 `service_role` key 放进来。
- 这是公开代理，Cloudflare 免费版有请求限制；小站够用。
- 如果以后 Supabase 直连恢复，把 `SUPABASE_PROXY` 改回空字符串即可。
