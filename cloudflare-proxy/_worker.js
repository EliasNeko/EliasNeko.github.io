const UPSTREAM = "https://wjvwupcquwjoajdvinkx.supabase.co";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "apikey, authorization, content-type, prefer, x-client-info, accept, range",
  "Access-Control-Expose-Headers": "content-range, content-length",
  "Access-Control-Max-Age": "86400"
};

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }

    if (!url.pathname.startsWith("/rest/v1/")) {
      return new Response("Supabase proxy is running.\n", {
        status: 200,
        headers: { "content-type": "text/plain; charset=utf-8", ...CORS }
      });
    }

    const target = new URL(url.pathname + url.search, UPSTREAM);
    const headers = new Headers(request.headers);
    headers.delete("host");
    headers.delete("cf-connecting-ip");

    const init = {
      method: request.method,
      headers,
      redirect: "manual"
    };
    if (request.method !== "GET" && request.method !== "HEAD") {
      init.body = request.body;
    }

    const res = await fetch(target, init);
    const out = new Headers(res.headers);
    for (const [key, value] of Object.entries(CORS)) out.set(key, value);
    return new Response(res.body, { status: res.status, headers: out });
  }
};
