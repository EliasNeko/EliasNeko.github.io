/* ============================================================
   全站转场
   ------------------------------------------------------------
   离开一个页面时，先把一块深色幕布盖上来，再跳走；
   到了下一页，这个脚本在 <head> 里就跑起来了，看到标记就先把
   屏幕盖住，等页面加载好再淡出。这样两页之间不会白屏闪一下。
   用法：需要转场的链接加 data-lqmy-nav，正常写 href 就行。
   ============================================================ */
(function () {
    "use strict";

    var KEY = "lqmy_nav";
    var mask = null;
    var reduced = false;

    try {
        reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch (e) {}

    function ensureMask() {
        if (mask) return mask;
        mask = document.createElement("div");
        mask.setAttribute("aria-hidden", "true");
        mask.style.cssText = [
            "position:fixed",
            "inset:0",
            "z-index:2147483000",
            "background:radial-gradient(900px 600px at 50% 45%, #0a1226, #05070f 70%)",
            "display:flex",
            "align-items:center",
            "justify-content:center",
            "opacity:0",
            "pointer-events:none",
            "transition:opacity .42s ease"
        ].join(";");
        mask.innerHTML = '<span style="font-size:12px;letter-spacing:.7em;text-indent:.7em;color:rgba(170,205,245,.75)">龍潛貓隱</span>';
        return mask;
    }

    function cover() {
        var m = ensureMask();
        m.style.transition = "none";
        m.style.opacity = "1";
        m.style.pointerEvents = "all";
        if (!m.parentNode) document.documentElement.appendChild(m);
        /* 强制一次重排，下一帧再开过渡 */
        void m.offsetWidth;
        m.style.transition = "opacity .42s ease";
        return m;
    }

    function uncover(m, delay) {
        setTimeout(function () {
            requestAnimationFrame(function () {
                m.style.transition = "opacity .5s ease";
                m.style.opacity = "0";
                m.style.pointerEvents = "none";
                setTimeout(function () {
                    if (m.parentNode) m.parentNode.removeChild(m);
                }, 560);
            });
        }, delay || 0);
    }

    /* ---------- 到达：先盖住，加载完再淡出 ---------- */
    var arriving = false;
    try {
        arriving = sessionStorage.getItem(KEY) === "1";
        if (arriving) sessionStorage.removeItem(KEY);
    } catch (e) {}

    /* 从站内别的页面转场过来的，就不要再放一次开场 */
    if (arriving) {
        window.__LQMY_ARRIVED = true;
    }

    if (arriving && !reduced) {
        var m = ensureMask();
        m.style.transition = "none";
        m.style.opacity = "1";
        m.style.pointerEvents = "all";
        document.documentElement.appendChild(m);

        var hidden = false;
        var hide = function () {
            if (hidden) return;
            hidden = true;
            uncover(m, 30);
        };

        if (document.readyState === "complete") {
            hide();
        } else {
            window.addEventListener("load", hide);
        }
        /* 兜底：图片再慢也不超过 1.8 秒 */
        setTimeout(hide, 1800);

        /* 从缓存回来的时候，把幕布收掉 */
        window.addEventListener("pageshow", function (ev) {
            if (ev.persisted) {
                if (m.parentNode) m.parentNode.removeChild(m);
            }
        });
    }

    /* ---------- 离开：点带标记的链接，先落幕布 ---------- */
    document.addEventListener(
        "click",
        function (ev) {
            var a = ev.target && ev.target.closest ? ev.target.closest("a[data-lqmy-nav]") : null;
            if (!a) return;
            if (ev.defaultPrevented || ev.button !== 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;

            var href = a.getAttribute("href");
            if (!href || href.charAt(0) === "#") return;

            ev.preventDefault();
            try {
                sessionStorage.setItem(KEY, "1");
            } catch (e) {}

            if (reduced) {
                location.href = href;
                return;
            }

            cover();
            setTimeout(function () {
                location.href = href;
            }, 440);
        },
        true
    );

    window.LQMY_NAV = {
        go: function (href) {
            try {
                sessionStorage.setItem(KEY, "1");
            } catch (e) {}
            cover();
            setTimeout(function () {
                location.href = href;
            }, 440);
        }
    };
})();
