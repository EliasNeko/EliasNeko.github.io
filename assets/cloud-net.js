/* 云端网络层：统一超时 / GET 重试 / 可选反向代理
   页面只要在 <head> 里加载它，后面所有 fetch 到 Supabase 的请求都会走这里。
   window.SUPABASE_PROXY 有值时，自动改写到代理域名。 */
(function () {
    "use strict";
    if (window.__cloudNetLoaded) return;
    window.__cloudNetLoaded = true;

    var SB = "https://wjvwupcquwjoajdvinkx.supabase.co";
    var DEFAULT_PROXY = "https://coffee-cloud.pages.dev"; /* Pages 反向代理 */
    var TIMEOUT = 25000;
    var origFetch = window.fetch ? window.fetch.bind(window) : null;
    if (!origFetch) return;

    function proxyBase() {
        var p = window.SUPABASE_PROXY || DEFAULT_PROXY;
        return p ? String(p).replace(/\/+$/, "") : "";
    }

    function isSupabase(url) {
        return typeof url === "string" && url.indexOf(SB) === 0;
    }

    function rewrite(url) {
        var base = proxyBase();
        if (!base || !isSupabase(url)) return url;
        return base + url.slice(SB.length);
    }

    function copyInit(init) {
        var out = {};
        init = init || {};
        for (var k in init) {
            if (Object.prototype.hasOwnProperty.call(init, k)) out[k] = init[k];
        }
        return out;
    }

    function shouldRetry(method) {
        return method === "GET" || method === "HEAD";
    }

    function sleep(ms) {
        return new Promise(function (resolve) { setTimeout(resolve, ms); });
    }

    function request(url, init, tries) {
        var method = String((init && init.method) || "GET").toUpperCase();
        var retry = shouldRetry(method);
        var ctrl = null;
        var timer = null;
        var opts = copyInit(init);

        if (typeof AbortController !== "undefined") {
            ctrl = new AbortController();
            opts.signal = ctrl.signal;
            timer = setTimeout(function () { ctrl.abort(); }, TIMEOUT);
        }
        if (!opts.cache) opts.cache = "no-store";

        return origFetch(rewrite(url), opts).then(function (res) {
            if (timer) clearTimeout(timer);
            if (retry && tries < 2 && (res.status === 429 || res.status >= 500)) {
                return sleep(450 * (tries + 1)).then(function () {
                    return request(url, init, tries + 1);
                });
            }
            return res;
        }, function (err) {
            if (timer) clearTimeout(timer);
            if (retry && tries < 2) {
                return sleep(450 * (tries + 1)).then(function () {
                    return request(url, init, tries + 1);
                });
            }
            throw err;
        });
    }

    window.fetch = function (input, init) {
        var url = typeof input === "string" ? input : (input && input.url);
        if (!isSupabase(url)) return origFetch(input, init);

        /* Request 对象暂时不改造，交给原始 fetch；本站目前都用字符串 URL */
        if (typeof input !== "string") return origFetch(input, init);
        return request(url, init, 0);
    };

    window.CloudNet = {
        supabase: SB,
        proxy: proxyBase,
        timeout: TIMEOUT
    };
})();
