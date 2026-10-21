/* 更新日志弹窗 —— 读取根目录的「更新日志.txt」，按访客设备上的今天取出对应条目 */
(function () {
    "use strict";

    if (window.__updatePopupLoaded) return;
    window.__updatePopupLoaded = true;

    function pad(n) { return n < 10 ? "0" + n : "" + n; }

    function todayStr() {
        var d = new Date();
        return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
    }

    /* 把 txt 解析成 { "2026-10-21": ["咖啡店：...", "知识库：..."] } */
    function parseLog(text) {
        var map = {};
        text = text.replace(/^\uFEFF/, "");
        var blocks = text.split(/\r?\n\s*\r?\n/);
        for (var i = 0; i < blocks.length; i++) {
            var lines = blocks[i].split(/\r?\n/);
            var clean = [];
            for (var j = 0; j < lines.length; j++) {
                var t = lines[j].trim();
                if (t) clean.push(t);
            }
            if (!clean.length) continue;
            if (clean[0].charAt(0) === "#") continue;
            if (!/^\d{4}-\d{2}-\d{2}$/.test(clean[0])) continue;
            map[clean[0]] = clean.slice(1);
        }
        return map;
    }

    function esc(s) {
        return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    function seenKey(date) { return "up-seen-" + date; }

    var today = todayStr();
    try { if (sessionStorage.getItem(seenKey(today))) return; } catch (e) {}

    var here = document.currentScript ? document.currentScript.src : location.href;
    var txtUrl = new URL("../更新日志.txt", here).href;

    fetch(txtUrl, { cache: "no-store" })
        .then(function (r) {
            if (!r.ok) throw new Error("HTTP " + r.status);
            return r.text();
        })
        .then(function (text) {
            var map = parseLog(text);
            var lines = map[today];
            show(lines && lines.length ? lines : null);
        })
        .catch(function () { /* 读不到日志就不打扰，页面照常用 */ });

    function show(lines) {
        try { sessionStorage.setItem(seenKey(today), "1"); } catch (e) {}

        var gold = location.pathname.indexOf("coffee-site") >= 0;
        var accent = gold ? "#c9a86a" : "#38bdf8";
        var panel = gold ? "#14100e" : "#0a1120";
        var text = gold ? "#e8dcc8" : "#d7e5f5";

        var body;
        if (lines) {
            body = '<ul class="up-list">';
            for (var i = 0; i < lines.length; i++) body += "<li>" + esc(lines[i]) + "</li>";
            body += "</ul>";
        } else {
            body = '<p class="up-none">今日无更新，快提供你的想法联系制作者更新，催他学习吧！</p>';
        }

        var wrap = document.createElement("div");
        wrap.className = "up-mask";
        wrap.innerHTML =
            '<div class="up-card" role="dialog" aria-modal="true" aria-label="更新日志">' +
                (lines ? '<p class="up-kicker">今日更新 · ' + today + "</p>" : '<p class="up-kicker">今 日 · ' + today + "</p>") +
                body +
                '<p class="up-contact">有想法、发现 bug、想催更 —— <a href="mailto:hyyzcn0115@163.com">hyyzcn0115@163.com</a> · 龙潜猫隐</p>' +
                '<button type="button" class="up-ok">知 道 了</button>' +
            "</div>";

        var css = document.createElement("style");
        css.textContent =
            ".up-mask{position:fixed;inset:0;z-index:900;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(0,0,0,.62);opacity:0;transition:opacity .25s}" +
            ".up-mask.show{opacity:1}" +
            ".up-card{width:100%;max-width:420px;background:" + panel + ";border:1px solid " + accent + "44;border-radius:14px;padding:24px 22px 18px;box-shadow:0 24px 60px rgba(0,0,0,.55);transform:translateY(14px);transition:transform .28s}" +
            ".up-mask.show .up-card{transform:translateY(0)}" +
            ".up-kicker{margin:0 0 14px;font-size:12px;letter-spacing:3px;color:" + accent + "}" +
            ".up-list{margin:0 0 16px;padding-left:18px;color:" + text + ";font-size:14px;line-height:1.9}" +
            ".up-none{margin:0 0 16px;color:" + text + ";font-size:14px;line-height:1.9}" +
            ".up-contact{margin:0 0 16px;font-size:12px;color:rgba(200,210,225,.5)}" +
            ".up-contact a{color:" + accent + ";text-decoration:none;border-bottom:1px solid " + accent + "55}" +
            ".up-ok{width:100%;padding:11px;border:1px solid " + accent + ";border-radius:8px;background:none;color:" + accent + ";font-size:14px;letter-spacing:2px;cursor:pointer}" +
            ".up-ok:hover{background:" + accent + "1a}";

        document.head.appendChild(css);
        document.body.appendChild(wrap);

        setTimeout(function () { wrap.classList.add("show"); }, 30);

        var closed = false;
        function close() {
            if (closed) return;
            closed = true;
            wrap.classList.remove("show");
            setTimeout(function () { if (wrap.parentNode) wrap.parentNode.removeChild(wrap); }, 260);
        }

        wrap.querySelector(".up-ok").addEventListener("click", close);
        wrap.addEventListener("click", function (e) { if (e.target === wrap) close(); });
        document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
    }
})();
