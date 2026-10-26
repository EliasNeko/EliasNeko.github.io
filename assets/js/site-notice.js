/* ============================================================
   旧入口提示
   ------------------------------------------------------------
   直接打开 /coffee-site/ 或 /knowledge-base/ 的老书签时，
   先弹一条「网站已更新」，六秒后自动去个人主页。
   从个人主页点过来会带 ?stay=1，那就安安静静地放行。
   想手动试：在地址后面加 ?notice=1。
   ============================================================ */
(function () {
    "use strict";

    var KEY = "lqmy_stay";
    var WAIT = 6000;

    function scriptHome() {
        var s = document.currentScript;
        if (!s) {
            var all = document.getElementsByTagName("script");
            for (var i = all.length - 1; i >= 0; i--) {
                if (all[i].src && all[i].src.indexOf("site-notice.js") >= 0) {
                    s = all[i];
                    break;
                }
            }
        }
        return (s && s.getAttribute("data-home")) || "../index.html";
    }

    var HOME = scriptHome();

    function read(key) {
        try {
            return sessionStorage.getItem(key);
        } catch (e) {
            return null;
        }
    }

    function write(key, val) {
        try {
            sessionStorage.setItem(key, val);
        } catch (e) {}
    }

    function cleanUrl() {
        try {
            var url = new URL(window.location.href);
            url.searchParams.delete("stay");
            url.searchParams.delete("notice");
            window.history.replaceState(null, "", url.pathname + url.search + url.hash);
        } catch (e) {}
    }

    var params = new URLSearchParams(window.location.search);
    var forced = params.get("notice") === "1";

    if (!forced) {
        if (params.get("stay") === "1") {
            write(KEY, "1");
            cleanUrl();
            return;
        }
        if (read(KEY) === "1") return;

        /* 站内互相跳转（咖啡店 ⇄ 书房 ⇄ 个人主页）不算走老入口 */
        var ref = document.referrer || "";
        if (ref && ref.indexOf(window.location.origin) === 0) return;
    }

    /* 反正就要跳走了，别再叠一个「今日更新」弹窗 */
    try {
        var d = new Date();
        var today =
            d.getFullYear() +
            "-" +
            (d.getMonth() + 1 < 10 ? "0" : "") +
            (d.getMonth() + 1) +
            "-" +
            (d.getDate() < 10 ? "0" : "") +
            d.getDate();
        sessionStorage.setItem("up-seen-" + today, "1");
    } catch (e) {}

    var reduce = false;
    try {
        reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch (e) {}

    var timer = null;
    var root = null;

    function goHome() {
        window.location.href = HOME;
    }

    function dismiss() {
        if (timer) clearTimeout(timer);
        write(KEY, "1");
        if (!root) return;
        root.classList.remove("on");
        setTimeout(function () {
            if (root && root.parentNode) root.parentNode.removeChild(root);
        }, 500);
    }

    function show() {
        root = document.createElement("div");
        root.className = "sn";
        if (window.location.pathname.indexOf("coffee-site") >= 0) root.className += " sn-warm";
        root.setAttribute("role", "dialog");
        root.setAttribute("aria-live", "polite");
        root.setAttribute("aria-label", "网站已全面更新");
        root.innerHTML =
            '<div class="sn-card">' +
            '<span class="sn-badge">2026 · 全新改版</span>' +
            '<button class="sn-close" type="button" aria-label="关闭">×</button>' +
            '<p class="sn-title">网站已经全面更新</p>' +
            '<p class="sn-desc">首页入口从咖啡店改成了 <b>龙潜猫隐的个人主页</b>，' +
            "咖啡店和书房都收进新首页里了。六秒后自动带你过去。</p>" +
            '<div class="sn-actions">' +
            '<a class="sn-go" href="' + HOME + '">立即前往</a>' +
            '<button class="sn-stay" type="button">先留在这里</button>' +
            "</div>" +
            '<div class="sn-bar"><i></i></div>' +
            "</div>";

        document.body.appendChild(root);

        root.querySelector(".sn-go").addEventListener("click", function (ev) {
            ev.preventDefault();
            if (timer) clearTimeout(timer);
            goHome();
        });
        root.querySelector(".sn-stay").addEventListener("click", dismiss);
        root.querySelector(".sn-close").addEventListener("click", dismiss);

        document.addEventListener("keydown", function (ev) {
            if (ev.key === "Escape") dismiss();
        });

        /* 下一帧再加 on，让淡入动画跑起来 */
        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                if (root) root.classList.add("on");
            });
        });

        timer = setTimeout(goHome, WAIT);

        /* 手动测试时，别真的把人跳走 */
        if (forced) {
            clearTimeout(timer);
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", show);
    } else {
        show();
    }
})();
