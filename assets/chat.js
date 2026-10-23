/* 聊天室 —— 全站通用的聊天球 + 聊天窗
   消息只保留 10 分钟（云端每次读写都会清理），关掉聊天就清空本地缓存。
   依赖：Supabase 的 chat_* 函数（见 supabase/升级-聊天室.sql）。 */
(function () {
    "use strict";
    if (window.__chatLoaded) return;
    window.__chatLoaded = true;

    /* 站长头衔样式：全站共用，页面已经显式引入就跳过 */
    (function () {
        try {
            var cs = document.currentScript;
            if (!cs || !cs.src) return;

            if (!document.querySelector('link[data-owner-badge]')) {
                var l = document.createElement("link");
                l.rel = "stylesheet";
                l.href = cs.src.replace(/chat\.js(?:\?.*)?$/, "owner-badge.css?v=20261028");
                l.setAttribute("data-owner-badge", "1");
                document.head.appendChild(l);
            }

            if (!document.querySelector('link[data-titles-badge]')) {
                var t = document.createElement("link");
                t.rel = "stylesheet";
                t.href = cs.src.replace(/chat\.js(?:\?.*)?$/, "titles.css?v=20261031");
                t.setAttribute("data-titles-badge", "1");
                document.head.appendChild(t);
            }
        } catch (e) {}
    })();

    var SB_URL = "https://wjvwupcquwjoajdvinkx.supabase.co";
    var SB_KEY = "sb_publishable_Wy3IyDHb-0yFAuRHbxuLFw_obIXU3OI";
    var H = { "apikey": SB_KEY, "Authorization": "Bearer " + SB_KEY, "Content-Type": "application/json" };

    var EMOJIS = ["😀","😄","😂","🤣","😊","😍","😘","😎","🤔","😴","😭","😡","🥺","😅","👍","👏","🙏","💪","🎉","🔥","❤️","✨","☕","🍰","🌙","⭐","🌧️","🐱","🐟","🍀","🎵","📚"];
    var OWNER_NAME = "龙潜猫隐";

    function isOwnerName(name) {
        return String(name == null ? "" : name).trim() === OWNER_NAME;
    }

    function ownerBadge(name) {
        return isOwnerName(name)
            ? '<span class="owner-badge" title="站长" aria-label="站长"><span class="crown" aria-hidden="true">♛</span>站长</span>'
            : "";
    }

    /* 聊天室只显示「站长亲封」里公开的紫色头衔；等级头衔是每个人自己的，不在这里展示 */
    var CHAT_SEALED = {
        "时雨": { name: "申鹤的🐶", tone: "purple", icon: "❄" },
        "龙潜猫隐": { name: "loli控", tone: "blue-purple", icon: "✦" }
    };

    function sealedChatBadge(name) {
        var t = CHAT_SEALED[String(name || "").trim()];
        if (!t) return "";
        return '<span class="title-chip fx-legend tone-' + t.tone + '" title="' + t.name + '">' +
            '<span class="tc-ico" aria-hidden="true">' + t.icon + '</span>' + t.name + '</span>';
    }

    /* ---------- 会话 ---------- */
    function session() {
        try { return JSON.parse(localStorage.getItem("coffee-session") || "null"); } catch (e) { return null; }
    }
    function me() { var s = session(); return s && s.name && s.hash ? s : null; }

    /* 站长封禁名单：先做本机管理版，配合站长工具使用 */
    (function () {
        var s = session();
        if (!s || !s.name || s.name === "龙潜猫隐") return;
        var bans = [];
        try { bans = JSON.parse(localStorage.getItem("coffee-bans-v1") || "[]"); } catch (e) {}
        if (Object.prototype.toString.call(bans) === "[object Array]" && bans.indexOf(s.name) >= 0) {
            document.body.innerHTML = '<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#14100e;color:#e8dcc8;font-family:Microsoft YaHei,sans-serif;text-align:center;line-height:2;padding:30px;">' +
                '<div><div style="font-size:22px;letter-spacing:3px;color:#c9a86a;margin-bottom:12px;">账号已被站长暂停</div>' +
                '这个账号暂时不能在店里使用。<br>如果你觉得是误判，可以给站长发邮件说明。</div></div>';
            window.__chatBanned = true;
        }
    })();
    if (window.__chatBanned) return;

    /* 云端封禁：站长工具写入的名单，所有设备都认 */
    (function () {
        var s = session();
        if (!s || !s.name || s.name === "龙潜猫隐") return;
        fetch(SB_URL + "/rest/v1/rpc/bans_all", {
            method: "POST",
            headers: H,
            body: "{}"
        }).then(function (r) { return r.ok ? r.json() : []; }).then(function (list) {
            if (Object.prototype.toString.call(list) === "[object Array]" && list.indexOf(s.name) >= 0) {
                document.body.innerHTML = '<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#14100e;color:#e8dcc8;font-family:Microsoft YaHei,sans-serif;text-align:center;line-height:2;padding:30px;">' +
                    '<div><div style="font-size:22px;letter-spacing:3px;color:#c9a86a;margin-bottom:12px;">账号已被站长暂停</div>' +
                    '这个账号暂时不能在店里使用。<br>如果你觉得是误判，可以给站长发邮件说明。</div></div>';
                window.__chatBanned = true;
            }
        }).catch(function () {});
    })();

    /* 站长工具：只有站长看得到，固定在页面右上角 */
    (function () {
        var s = session();
        if (!s || s.name !== "龙潜猫隐") return;
        if (location.pathname.indexOf("owner-tools") >= 0) return;
        var a = document.createElement("a");
        a.className = "owner-tool-fab";
        a.textContent = "站长工具";
        a.href = location.pathname.indexOf("/coffee-site/") >= 0 ? "owner-tools.html" : "../coffee-site/owner-tools.html";
        document.body.appendChild(a);
    })();

    /* 站长授予新头衔：被授予者浏览网页时收到提示 */
    (function () {
        var s = session();
        if (!s || !s.name) return;

        var KEY = "coffee-titles-seen-v1:" + s.name;
        var hideTimer = null;

        function profileHref() {
            return location.pathname.indexOf("/coffee-site/") >= 0
                ? "profile.html"
                : "../coffee-site/profile.html";
        }

        function showToast(list) {
            var old = document.getElementById("titleToast");
            if (old) old.remove();

            var chips = "";
            for (var i = 0; i < list.length && i < 3; i++) {
                var t = list[i];
                chips += '<span class="title-chip fx-legend tone-' + escapeHtml(t.tone || "purple") + '">' +
                    '<span class="tc-ico" aria-hidden="true">' + escapeHtml(t.icon || "✦") + '</span>' +
                    escapeHtml(t.name) + '</span>';
            }
            if (list.length > 3) chips += '<span>等 ' + list.length + ' 个</span>';

            var el = document.createElement("div");
            el.className = "title-toast";
            el.id = "titleToast";
            el.innerHTML = '<button class="tt-close" type="button" aria-label="关闭">×</button>' +
                '<div class="tt-k">站长亲封 · 新头衔</div>' +
                '<div class="tt-main">' + chips + '<span>已授予你</span></div>' +
                '<a class="tt-link" href="' + profileHref() + '">去个人资料看看 →</a>';
            document.body.appendChild(el);
            requestAnimationFrame(function () { el.classList.add("show"); });

            el.querySelector(".tt-close").addEventListener("click", function () {
                el.classList.remove("show");
                setTimeout(function () { if (el.parentNode) el.remove(); }, 250);
            });

            clearTimeout(hideTimer);
            hideTimer = setTimeout(function () {
                el.classList.remove("show");
                setTimeout(function () { if (el.parentNode) el.remove(); }, 250);
            }, 9000);
        }

        function check() {
            fetch(SB_URL + "/rest/v1/rpc/titles_all", {
                method: "POST",
                headers: H,
                body: "{}"
            }).then(function (r) { return r.ok ? r.json() : null; }).then(function (all) {
                if (!all || Object.prototype.toString.call(all) !== "[object Array]") return;
                var mine = all.filter(function (t) { return t && t.user === s.name; });
                var raw = null;
                try { raw = localStorage.getItem(KEY); } catch (e) {}

                var seen = [];
                if (raw !== null) {
                    try { seen = JSON.parse(raw) || []; } catch (e) {}
                }

                var fresh = mine.filter(function (t) { return seen.indexOf(t.id) < 0; });
                if (fresh.length) {
                    showToast(fresh);
                } else if (raw === null && mine.length) {
                    showToast(mine);
                }

                try {
                    localStorage.setItem(KEY, JSON.stringify(mine.map(function (t) { return t.id; })));
                } catch (e) {}
            }).catch(function () {});
        }

        check();
        setInterval(check, 60000);
        document.addEventListener("visibilitychange", function () {
            if (!document.hidden) check();
        });
    })();

    /* 使用时长：登录用户每 30 秒 +30 秒，存在本机；头衔系统按这个算等级 */
    (function () {
        var s = session();
        if (!s || !s.name) return;
        var key = "coffee-usage-v1:" + s.name;
        setInterval(function () {
            if (document.visibilityState && document.visibilityState !== "visible") return;
            var n = 0;
            try { n = parseFloat(localStorage.getItem(key)) || 0; } catch (e) {}
            try { localStorage.setItem(key, String(n + 30)); } catch (e) {}
        }, 30000);
    })();

    function rpc(name, body) {
        return fetch(SB_URL + "/rest/v1/rpc/" + name, { method: "POST", headers: H, body: JSON.stringify(body) })
            .then(function (r) { return r.ok ? r.json() : null; });
    }

    /* ---------- 样式 ---------- */
    var css = document.createElement("style");
    css.textContent = [
        ".chat-ball{position:fixed;right:22px;bottom:96px;width:56px;height:56px;border-radius:50%;z-index:120;display:flex;align-items:center;justify-content:center;font-size:24px;cursor:grab;user-select:none;background:linear-gradient(135deg,#38bdf8,#6366f1);color:#04121f;box-shadow:0 12px 30px rgba(2,6,15,.5);border:1px solid rgba(255,255,255,.5);touch-action:none}",
        ".chat-ball:active{cursor:grabbing}",
        ".chat-ball .dot{position:absolute;top:6px;right:6px;width:10px;height:10px;border-radius:50%;background:#f87171;display:none}",
        ".chat-ball .dot.show{display:block}",
        ".chat-btn{border:1px solid rgba(201,168,106,.4);background:none;color:inherit;font:inherit;font-size:12px;letter-spacing:1px;padding:6px 14px;border-radius:999px;cursor:pointer}",
        ".chat-drop{position:fixed;z-index:130;min-width:210px;padding:10px;border-radius:14px;background:#0d1524;border:1px solid rgba(56,189,248,.35);box-shadow:0 18px 40px rgba(0,0,0,.55);font-family:'Microsoft YaHei',sans-serif}",
        ".chat-drop.cream{background:#1a1512;border-color:rgba(201,168,106,.4)}",
        ".chat-drop button{display:block;width:100%;text-align:left;padding:9px 12px;border:0;border-radius:8px;background:none;color:#e8f0fd;font:inherit;font-size:13px;cursor:pointer}",
        ".chat-drop.cream button{color:#e8dcc8}",
        ".chat-drop button:hover{background:rgba(56,189,248,.14)}",
        ".chat-drop.cream button:hover{background:rgba(201,168,106,.14)}",
        ".chat-drop .sub{padding-left:22px;font-size:12.5px;opacity:.85}",
        ".chat-drop .hint{padding:6px 12px;font-size:11.5px;opacity:.5}",
        ".chat-win{position:fixed;right:22px;bottom:164px;width:min(360px,92vw);height:min(480px,70vh);z-index:125;display:none;flex-direction:column;background:#0a1120;border:1px solid rgba(56,189,248,.35);border-radius:16px;overflow:hidden;box-shadow:0 24px 60px rgba(0,0,0,.6);font-family:'Microsoft YaHei',sans-serif}",
        ".chat-win.cream{background:#14100e;border-color:rgba(201,168,106,.4)}",
        ".chat-win.show{display:flex}",
        ".chat-head{display:flex;align-items:center;gap:8px;padding:12px 14px;border-bottom:1px solid rgba(120,160,220,.18)}",
        ".chat-win.cream .chat-head{border-color:rgba(201,168,106,.2)}",
        ".chat-head .name{flex:1;font-size:13px;letter-spacing:1px;color:#cfe6ff}",
        ".chat-win.cream .chat-head .name{color:#e8d6b4}",
        ".chat-head button{border:0;background:none;color:#8fb3d9;font-size:18px;cursor:pointer}",
        ".chat-body{flex:1;overflow-y:auto;padding:12px 14px;display:flex;flex-direction:column;gap:10px}",
        ".chat-msg{display:flex;gap:8px;align-items:flex-start}",
        ".chat-msg .av{width:26px;height:26px;border-radius:50%;flex:0 0 auto;display:flex;align-items:center;justify-content:center;font-size:12px;background:#1d2b45;color:#9fc9f5}",
        ".chat-win.cream .chat-msg .av{background:#2a2119;color:#e0c48c}",
        ".chat-msg .bubble{max-width:78%;padding:8px 11px;border-radius:10px;background:#111c30;color:#dbe9fb;font-size:13px;line-height:1.7;word-break:break-word}",
        ".chat-win.cream .chat-msg .bubble{background:#1f1813;color:#e8dcc8}",
        ".chat-msg.mine{flex-direction:row-reverse}",
        ".chat-msg.mine .bubble{background:#1e4a6b;color:#e6f4ff}",
        ".chat-win.cream .chat-msg.mine .bubble{background:#3a2c1c;color:#f5e9d6}",
        ".chat-msg .who{font-size:10.5px;color:#8fb3d9;margin-bottom:2px;display:flex;align-items:center;flex-wrap:wrap;gap:3px}",
        ".chat-msg img{max-width:160px;border-radius:8px;display:block}",
        ".chat-empty{margin:auto;color:#6b7f9c;font-size:12.5px;text-align:center;line-height:2;padding:20px}",
        ".chat-input{display:flex;gap:6px;padding:10px;border-top:1px solid rgba(120,160,220,.18);align-items:center}",
        ".chat-win.cream .chat-input{border-color:rgba(201,168,106,.2)}",
        ".chat-input input[type=text]{flex:1;min-width:0;padding:9px 12px;border-radius:999px;border:1px solid rgba(120,160,220,.3);background:#0e1726;color:#e8f0fd;font:inherit;font-size:13px;outline:none}",
        ".chat-win.cream .chat-input input[type=text]{background:#0f0b09;border-color:rgba(201,168,106,.3);color:#f3e7d3}",
        ".chat-input button{border:0;background:none;font-size:17px;cursor:pointer;padding:2px 4px}",
        ".chat-emoji{position:absolute;bottom:56px;left:10px;right:10px;display:none;flex-wrap:wrap;gap:2px;padding:8px;border-radius:10px;background:#0d1524;border:1px solid rgba(56,189,248,.3);max-height:150px;overflow-y:auto}",
        ".chat-emoji.show{display:flex}",
        ".chat-emoji span{font-size:19px;width:30px;height:30px;display:flex;align-items:center;justify-content:center;cursor:pointer;border-radius:6px}",
        ".chat-emoji span:hover{background:rgba(56,189,248,.15)}",
        ".chat-modal{position:fixed;inset:0;z-index:140;display:none;align-items:center;justify-content:center;background:rgba(2,6,15,.7);padding:20px}",
        ".chat-modal.show{display:flex}",
        ".chat-modal .box{width:min(420px,94vw);max-height:74vh;display:flex;flex-direction:column;background:#0d1524;border:1px solid rgba(56,189,248,.35);border-radius:16px;overflow:hidden;font-family:'Microsoft YaHei',sans-serif}",
        ".chat-modal .h{padding:14px 16px;border-bottom:1px solid rgba(120,160,220,.18);display:flex;align-items:center;gap:10px}",
        ".chat-modal .h b{flex:1;font-weight:normal;font-size:14px;letter-spacing:1px;color:#cfe6ff}",
        ".chat-modal .h button{border:0;background:none;color:#8fb3d9;font-size:18px;cursor:pointer}",
        ".chat-modal .s{padding:10px 14px}",
        ".chat-modal .s input{width:100%;padding:9px 12px;border-radius:999px;border:1px solid rgba(120,160,220,.3);background:#0e1726;color:#e8f0fd;font:inherit;font-size:13px;outline:none}",
        ".chat-modal .list{flex:1;overflow-y:auto;padding:0 14px 14px}",
        ".chat-row{display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px dashed rgba(120,160,220,.12)}",
        ".chat-row .av{width:32px;height:32px;border-radius:50%;overflow:hidden;flex:0 0 auto;background:#1d2b45;color:#9fc9f5;display:flex;align-items:center;justify-content:center;font-size:12px}",
        ".chat-row .av img{width:100%;height:100%;object-fit:cover}",
        ".chat-row .n{flex:1;min-width:0;display:flex;align-items:center;flex-wrap:wrap;gap:5px;font-size:13px;color:#dbe9fb}",
        ".chat-row .ops{display:flex;gap:6px;flex:0 0 auto}",
        ".chat-row .ops button{padding:5px 9px;border:1px solid rgba(56,189,248,.35);border-radius:999px;background:none;color:#9fc9f5;font:inherit;font-size:11px;cursor:pointer}",
        ".chat-row .ops button:hover{background:rgba(56,189,248,.12)}",
        "@media (max-width:560px){.chat-win{right:10px;bottom:150px;width:94vw;height:64vh}.chat-ball{right:14px;bottom:88px}}",
        "@media (max-width:820px){.chat-btn{display:none!important}}"
    ].join("");
    document.head.appendChild(css);

    /* ---------- 聊天球（可拖动） ---------- */
    var ball = document.createElement("div");
    ball.className = "chat-ball";
    ball.innerHTML = '💬<span class="dot" id="chatDot"></span>';
    document.body.appendChild(ball);

    var ballPos = null;
    try { ballPos = JSON.parse(localStorage.getItem("coffee-chat-ball") || "null"); } catch (e) {}

    function applyBallPos(x, y) {
        var w = 56, h = 56;
        x = Math.max(8, Math.min(window.innerWidth - w - 8, x));
        y = Math.max(70, Math.min(window.innerHeight - h - 8, y));
        ball.style.left = x + "px";
        ball.style.top = y + "px";
        ball.style.right = "auto";
        ball.style.bottom = "auto";
        return { x: x, y: y };
    }

    if (ballPos) applyBallPos(ballPos.x, ballPos.y);

    var dragging = false, moved = false, sx = 0, sy = 0, bx = 0, by = 0;

    ball.addEventListener("pointerdown", function (e) {
        dragging = true; moved = false;
        var r = ball.getBoundingClientRect();
        bx = r.left; by = r.top;
        sx = e.clientX; sy = e.clientY;
        ball.setPointerCapture(e.pointerId);
    });

    ball.addEventListener("pointermove", function (e) {
        if (!dragging) return;
        var dx = e.clientX - sx, dy = e.clientY - sy;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved = true;
        applyBallPos(bx + dx, by + dy);
    });

    ball.addEventListener("pointerup", function (e) {
        dragging = false;
        try { ball.releasePointerCapture(e.pointerId); } catch (err) {}
        if (moved) {
            var r = ball.getBoundingClientRect();
            try { localStorage.setItem("coffee-chat-ball", JSON.stringify({ x: r.left, y: r.top })); } catch (err) {}
        } else {
            openChat();
        }
    });

    /* ---------- 状态 ---------- */
    var state = {
        room: null,
        roomName: "",
        lastId: 0,
        timer: null,
        open: false,
        online: 0,
        publicCount: 0
    };

    function gold() { return location.pathname.indexOf("coffee-site") >= 0; }

    /* ---------- 聊天窗 ---------- */
    var win = document.createElement("div");
    win.className = "chat-win" + (gold() ? " cream" : "");
    win.innerHTML = [
        '<div class="chat-head">',
        '  <span class="name" id="chatTitle">聊天室</span>',
        '  <button type="button" id="chatClose" title="关闭">×</button>',
        '</div>',
        '<div class="chat-body" id="chatBody"></div>',
        '<div class="chat-input">',
        '  <button type="button" id="chatEmojiBtn" title="表情">😊</button>',
        '  <button type="button" id="chatImgBtn" title="图片">🖼️</button>',
        '  <input type="text" id="chatText" placeholder="说点什么…" maxlength="300">',
        '  <button type="button" id="chatSend" title="发送">➤</button>',
        '</div>',
        '<div class="chat-emoji" id="chatEmoji"></div>'
    ].join("");
    document.body.appendChild(win);

    var body = win.querySelector("#chatBody");
    var title = win.querySelector("#chatTitle");
    var text = win.querySelector("#chatText");
    var emojiBox = win.querySelector("#chatEmoji");

    EMOJIS.forEach(function (e) {
        var s = document.createElement("span");
        s.textContent = e;
        s.addEventListener("click", function () { text.value += e; text.focus(); });
        emojiBox.appendChild(s);
    });

    win.querySelector("#chatEmojiBtn").addEventListener("click", function () { emojiBox.classList.toggle("show"); });
    win.querySelector("#chatClose").addEventListener("click", closeChat);

    win.querySelector("#chatImgBtn").addEventListener("click", function () {
        var input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = function () {
            var f = input.files && input.files[0];
            if (!f) return;
            if (f.size > 8 * 1024 * 1024) { alert("图片太大了，换一张小于 8MB 的。"); return; }
            var img = new Image();
            var url = URL.createObjectURL(f);
            img.onload = function () {
                var max = 320;
                var scale = Math.min(1, max / Math.max(img.width, img.height));
                var canvas = document.createElement("canvas");
                canvas.width = Math.round(img.width * scale);
                canvas.height = Math.round(img.height * scale);
                canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
                URL.revokeObjectURL(url);
                send("", canvas.toDataURL("image/jpeg", 0.62));
            };
            img.src = url;
        };
        input.click();
    });

    win.querySelector("#chatSend").addEventListener("click", function () { send(text.value); text.value = ""; });
    text.addEventListener("keydown", function (e) { if (e.key === "Enter") { send(text.value); text.value = ""; } });

    /* ---------- 消息 ---------- */
    function renderMessages(list, append) {
        if (!append) body.innerHTML = "";

        if (!list.length && !append) {
            body.innerHTML = '<div class="chat-empty">这里还安静着。<br>说点什么吧，消息只留 10 分钟。</div>';
            return;
        }

        var empty = body.querySelector(".chat-empty");
        if (empty) empty.remove();

        var s = me();
        list.forEach(function (m) {
            var isMine = s && m.name === s.name;
            var row = document.createElement("div");
            row.className = "chat-msg" + (isMine ? " mine" : "");

            var av = document.createElement("div");
            av.className = "av";
            av.textContent = (m.name || "?").slice(0, 1);

            var bubble = document.createElement("div");
            bubble.className = "bubble";
            bubble.innerHTML = '<div class="who">' + escapeHtml(m.name) + ownerBadge(m.name) + sealedChatBadge(m.name) + "</div>";

            if (m.image) {
                var im = document.createElement("img");
                im.src = m.image;
                bubble.appendChild(im);
            }
            if (m.body) {
                var p = document.createElement("div");
                p.textContent = m.body;
                bubble.appendChild(p);
            }

            row.appendChild(av);
            row.appendChild(bubble);
            body.appendChild(row);
            if (m.id > state.lastId) state.lastId = m.id;
        });

        body.scrollTop = body.scrollHeight;
    }

    function escapeHtml(s) {
        return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    function fetchMessages(initial) {
        if (!state.room) return;

        rpc("chat_fetch", { p_room: state.room, p_after: state.lastId }).then(function (d) {
            if (!d || !d.ok) {
                if (initial) body.innerHTML = '<div class="chat-empty">连不上云端。<br>检查一下网络，再点一次聊天球。</div>';
                return;
            }

            var list = d.messages || [];

            if (list.length) {
                renderMessages(list, state.lastId > 0);
                return;
            }

            if (initial || state.lastId === 0) {
                body.innerHTML = '<div class="chat-empty">已连接。<br>这里还安静着，说点什么吧。</div>';
            }
        }).catch(function () {
            if (initial) body.innerHTML = '<div class="chat-empty">连不上云端。<br>检查一下网络，再点一次聊天球。</div>';
        });
    }

    function send(bodyText, image) {
        var s = me();
        if (!s) { alert("先登录才能聊天。"); return; }
        if (!state.room) return;
        if (!bodyText && !image) return;

        rpc("chat_send", { p_name: s.name, p_hash: s.hash, p_room: state.room, p_body: bodyText || "", p_image: image || "" })
            .then(function () { fetchMessages(); })
            .catch(function () {});
    }

    /* ---------- 打开 / 关闭 ---------- */
    function openChat(room, name) {
        var s = me();
        if (!s) {
            alert("聊天室需要先登录。");
            location.href = "account.html";
            return;
        }

        state.room = room || state.room || "public";
        state.roomName = name || state.roomName || "公共聊天室";
        state.lastId = 0;
        body.innerHTML = '<div class="chat-empty">正在连接…</div>';
        title.textContent = state.roomName;

        var oldExit = win.querySelector("#chatExit");
        if (oldExit) oldExit.remove();
        if (state.room !== "public") {
            var exitBtn = document.createElement("button");
            exitBtn.id = "chatExit";
            exitBtn.type = "button";
            exitBtn.textContent = "退出房间";
            exitBtn.style.cssText = "font-size:11.5px;padding:5px 9px;border:1px solid rgba(56,189,248,.35);border-radius:999px;background:none;color:#9fc9f5;margin-right:4px;cursor:pointer;flex:0 0 auto;";
            exitBtn.addEventListener("click", function () { openChat("public", "公共聊天室"); });
            win.querySelector(".chat-head").insertBefore(exitBtn, win.querySelector("#chatClose"));
        }

        win.classList.add("show");
        state.open = true;

        fetchMessages(true);
        clearInterval(state.timer);
        state.timer = setInterval(fetchMessages, 3000);

        rpc("chat_ping", { p_name: s.name, p_hash: s.hash }).then(function (d) {
            if (d && d.ok) {
                document.getElementById("chatDot").classList.remove("show");
            }
        }).catch(function () {});
    }

    function closeChat() {
        win.classList.remove("show");
        state.open = false;
        clearInterval(state.timer);
        state.timer = null;
        body.innerHTML = "";        /* 本地不保留 */
        state.lastId = 0;
        state.room = "public";
        state.roomName = "公共聊天室";
    }

    /* ---------- 顶部按钮 ---------- */
    function buildDropdown(anchor) {
        var drop = document.createElement("div");
        drop.className = "chat-drop" + (gold() ? " cream" : "");
        drop.style.display = "none";
        document.body.appendChild(drop);

        function place() {
            var r = anchor.getBoundingClientRect();
            drop.style.left = Math.min(window.innerWidth - 240, Math.max(8, r.left)) + "px";
            drop.style.top = (r.bottom + 8) + "px";
        }

        function renderMain() {
            drop.innerHTML =
                '<button data-act="public">公共聊天室 <span style="opacity:.6">（' + state.publicCount + ' 条消息）</span></button>' +
                '<button data-act="private">1v1 聊天 ▸</button>' +
                '<button data-act="users">查看在线用户</button>';
        }

        function renderPrivate() {
            drop.innerHTML =
                '<button data-act="create">创建房间</button>' +
                '<button data-act="join">加入房间</button>' +
                '<button data-act="users">查看在线用户</button>' +
                '<button data-act="back">← 返回</button>';
        }

        drop.addEventListener("click", function (e) {
            e.stopPropagation();
            var b = e.target.closest("button");
            if (!b) return;
            var act = b.getAttribute("data-act");

            if (act === "public") { drop.style.display = "none"; openChat("public", "公共聊天室"); }
            else if (act === "private") { renderPrivate(); }
            else if (act === "back") { renderMain(); }
            else if (act === "create") { drop.style.display = "none"; createRoom(); }
            else if (act === "join") { drop.style.display = "none"; joinRoom(); }
            else if (act === "users") { drop.style.display = "none"; showOnline(); }
        });

        anchor.addEventListener("mouseenter", function () {
            place();
            renderMain();
            drop.style.display = "block";
        });

        anchor.addEventListener("click", function (e) {
            e.stopPropagation();
            place();
            renderMain();
            drop.style.display = drop.style.display === "none" ? "block" : "none";
        });

        document.addEventListener("click", function () { drop.style.display = "none"; });

        function keepInPlace() {
            if (drop.style.display === "none") return;
            var r = anchor.getBoundingClientRect();
            if (r.bottom < 0 || r.top > window.innerHeight) {
                drop.style.display = "none";
                return;
            }
            place();
        }

        window.addEventListener("resize", keepInPlace);
        window.addEventListener("scroll", keepInPlace, { passive: true });
    }

    function createRoom() {
        var s = me();
        if (!s) { alert("先登录。"); return; }

        var room = prompt("房间号（6 位数字，自己定）：");
        if (!room) return;
        if (!/^\d{6}$/.test(room)) { alert("房间号必须是 6 位数字。"); return; }

        var pwd = prompt("房间密码（可以不填，不填就是公开房）：") || "";
        var pwdHash = "";
        if (pwd) {
            crypto.subtle.digest("SHA-256", new TextEncoder().encode(pwd)).then(function (buf) {
                pwdHash = Array.from(new Uint8Array(buf)).map(function (b) { return ("0" + b.toString(16)).slice(-2); }).join("");
                doCreate(room, pwdHash, pwd);
            });
            return;
        }
        doCreate(room, "", "");
    }

    function doCreate(room, pwdHash, pwd) {
        var s = me();
        rpc("chat_create_room", { p_name: s.name, p_hash: s.hash, p_room: room, p_password: pwdHash }).then(function (d) {
            if (d && d.ok) {
                alert("房间 " + room + " 建好了" + (pwd ? "（有密码）" : "（无密码）") + "，把房间号发给朋友。");
                openChat(room, "房间 " + room);
            } else if (d && d.error === "exists") {
                alert("这个房间号已经有人用了，换一个。");
            } else {
                alert("建房间没成功，稍后再试。");
            }
        }).catch(function () { alert("连不上云端。"); });
    }

    function joinRoom() {
        var room = prompt("输入 6 位房间号：");
        if (!room) return;
        if (!/^\d{6}$/.test(room)) { alert("房间号是 6 位数字。"); return; }

        var pwd = prompt("房间密码（没设密码就直接确定）：") || "";
        var s = me();
        if (!s) { alert("先登录。"); return; }

        var pwdHash = "";
        var go = function (hash) {
            rpc("chat_join_room", { p_name: s.name, p_hash: s.hash, p_room: room, p_password: hash }).then(function (d) {
                if (d && d.ok) openChat(room, "房间 " + room);
                else if (d && d.error === "bad-password") alert("密码不对。");
                else if (d && d.error === "no-room") alert("没有这个房间。");
                else alert("进不去，稍后再试。");
            }).catch(function () { alert("连不上云端。"); });
        };

        if (!pwd) { go(""); return; }
        crypto.subtle.digest("SHA-256", new TextEncoder().encode(pwd)).then(function (buf) {
            pwdHash = Array.from(new Uint8Array(buf)).map(function (b) { return ("0" + b.toString(16)).slice(-2); }).join("");
            go(pwdHash);
        });
    }

    /* ---------- 在线用户 ---------- */
    function showOnline() {
        var s = me();
        if (!s) { alert("先登录。"); return; }

        var mask = document.createElement("div");
        mask.className = "chat-modal show";
        mask.innerHTML =
            '<div class="box">' +
            '<div class="h"><b>在线用户</b><button type="button" class="x">×</button></div>' +
            '<div class="s" style="padding-bottom:0;"><span id="onlineStats" style="font-size:12px;color:#8fb3d9;letter-spacing:.5px;">正在统计…</span></div>' +
            '<div class="s"><input type="text" id="onlineSearch" placeholder="搜索用户名…"></div>' +
            '<div class="list" id="onlineList"><div class="chat-empty">正在获取…</div></div>' +
            '</div>';
        document.body.appendChild(mask);

        function close() { mask.remove(); }
        mask.querySelector(".x").addEventListener("click", close);

        var listEl = mask.querySelector("#onlineList");
        var input = mask.querySelector("#onlineSearch");
        var users = [];

        function render(keyword) {
            var k = (keyword || "").trim().toLowerCase();
            var rows = users.filter(function (u) { return !k || u.name.toLowerCase().indexOf(k) >= 0; });

            if (!rows.length) {
                listEl.innerHTML = '<div class="chat-empty">没有找到人。<br><span style="font-size:11.5px;opacity:.7;">游客不在这个名单里。</span></div>';
                return;
            }
            listEl.innerHTML = "";
            rows.forEach(function (u) {
                var row = document.createElement("div");
                row.className = "chat-row" + (isOwnerName(u.name) ? " owner-row" : "");
                row.innerHTML =
                    '<div class="av">' + (u.avatar ? '<img src="' + u.avatar + '" alt="">' : escapeHtml(u.name.slice(0, 1))) + '</div>' +
                    '<div class="n">' + escapeHtml(u.name) + ownerBadge(u.name) + sealedChatBadge(u.name) + '</div>' +
                    '<div class="ops">' +
                    '<button data-invite="' + escapeHtml(u.name) + '">邀请</button>' +
                    '<button data-friend="' + escapeHtml(u.name) + '">加好友</button>' +
                    '</div>';
                listEl.appendChild(row);
            });
        }

        input.addEventListener("input", function () { render(input.value); });

        listEl.addEventListener("click", function (e) {
            var b = e.target.closest("button");
            if (!b) return;
            var invite = b.getAttribute("data-invite");
            var friend = b.getAttribute("data-friend");

            if (invite) inviteFriend(invite);
            if (friend) {
                rpc("friend_request_send", { p_name: s.name, p_hash: s.hash, p_to: friend }).then(function (d) {
                    if (d && d.ok) { b.textContent = "已申请"; b.disabled = true; }
                    else if (d && d.error === "already") { b.textContent = "已是好友"; b.disabled = true; }
                    else if (d && d.error === "waiting") { b.textContent = "等对方"; b.disabled = true; }
                    else if (d && d.error === "cooldown") { b.textContent = "稍后再试"; }
                    else { b.textContent = "失败"; }
                });
            }
        });

        rpc("chat_online", { p_name: s.name, p_hash: s.hash }).then(function (d) {
            if (d && d.ok) { users = d.users || []; render(""); }
            else listEl.innerHTML = '<div class="chat-empty">拿不到在线名单。</div>';

            /* 统计：设备在线 - 正式用户 = 游客 */
            var device = "";
            try { device = localStorage.getItem("coffee-device-id") || ""; } catch (e) {}
            if (!device) device = "probe-" + Date.now();

            rpc("heartbeat", { p_device: device }).then(function (hb) {
                var dev = (hb && hb.online) || 0;
                var mem = users.length;
                var guest = Math.max(0, dev - mem);
                var el = document.getElementById("onlineStats");
                if (el) el.innerHTML = "在线 <b style='color:#7dd3fc;font-weight:normal'>" + dev + "</b>（正式用户：" + mem + " · 游客：" + guest + "）";
            }).catch(function () {
                var el = document.getElementById("onlineStats");
                if (el) el.textContent = "正式用户：" + users.length + "（游客数暂时取不到）";
            });
        }).catch(function () { listEl.innerHTML = '<div class="chat-empty">连不上云端。</div>'; });
    }

    /* 邀请：建一个临时房间，发一条邀请给对方（对方收到弹窗） */
    function inviteFriend(name) {
        var s = me();
        if (!s) return;

        var room = String(Math.floor(100000 + Math.random() * 900000));
        rpc("chat_create_room", { p_name: s.name, p_hash: s.hash, p_room: room, p_password: "" }).then(function (d) {
            if (!d || !d.ok) { alert("房间没建起来，稍后再试。"); return; }
            return rpc("invite_send", { p_name: s.name, p_hash: s.hash, p_to: name, p_room: room });
        }).then(function (r) {
            if (r && r.ok) {
                alert("邀请已发出，等对方接（30 秒内有效）。");
                openChat(room, "房间 " + room);
            }
            else if (r && r.error === "cooldown") alert("刚邀请过，等 30 秒再试。");
            else if (r && r.error === "self") alert("不能邀请自己。");
            else alert("邀请没发出去，再试一次。");
        }).catch(function () { alert("连不上云端。"); });
    }

    /* ---------- 挂到导航栏 ---------- */
    function mountButton() {
        var s = me();
        if (!s) return;

        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "chat-btn";
        btn.textContent = "聊天室";

        var navRight = document.querySelector(".nav-right");
        if (navRight) {
            navRight.insertBefore(btn, navRight.firstChild);
            buildDropdown(btn);
            return;
        }

        var meta = document.querySelector(".top .series") || document.querySelector(".top .meta");
        if (meta) {
            var wrap = document.createElement("p");
            wrap.style.cssText = "margin-top:14px;";
            wrap.appendChild(btn);
            meta.parentNode.insertBefore(wrap, meta.nextSibling);
            buildDropdown(btn);
        }
    }

    mountButton();

    /* 每 30 秒报一次在线 */
    var s0 = me();
    if (s0) {
        var ping = function () {
            rpc("chat_ping", { p_name: s0.name, p_hash: s0.hash }).then(function (d) {
                if (d && d.ok) { state.online = d.online; state.publicCount = d.public_count; }
            }).catch(function () {});
        };
        ping();
        setInterval(ping, 30000);
    }



    /* ---------- 聊天框里的系统提示 ---------- */
    function systemNote(t) {
        if (!state.open) { alert(t); return; }
        var d = document.createElement("div");
        d.className = "chat-empty";
        d.style.cssText = "margin:8px auto;font-size:11.5px;color:#7f93ad;";
        d.textContent = t;
        body.appendChild(d);
        body.scrollTop = body.scrollHeight;
    }

    /* ---------- 收到好友申请 ---------- */
    var friendReqShowing = false;

    function showFriendRequest(req) {
        if (!req || friendReqShowing) return;
        friendReqShowing = true;

        var mask = document.createElement("div");
        mask.className = "chat-modal show";
        mask.innerHTML = '<div class="box" style="max-width:340px">' +
            '<div class="h"><b>好友申请</b></div>' +
            '<div class="s" style="font-size:13px;line-height:2;color:#dbe9fb">' +
            '<b id="frFrom" style="color:#7dd3fc;font-weight:normal"></b> 想加你为好友。' +
            '</div>' +
            '<div class="s" style="display:flex;gap:10px;padding-bottom:16px">' +
            '<button class="chat-btn" id="frYes" style="flex:1;background:rgba(56,189,248,.18)">同 意</button>' +
            '<button class="chat-btn" id="frNo" style="flex:1">拒 绝</button>' +
            '</div></div>';
        document.body.appendChild(mask);

        mask.querySelector("#frFrom").textContent = req.from;

        function close() { mask.remove(); friendReqShowing = false; }

        mask.querySelector("#frNo").addEventListener("click", function () {
            var s = me();
            if (s) rpc("friend_request_answer", { p_name: s.name, p_hash: s.hash, p_id: req.id, p_accept: false });
            close();
            systemNote("已拒绝 " + req.from + " 的好友申请。");
        });

        mask.querySelector("#frYes").addEventListener("click", function () {
            var s = me();
            if (!s) { close(); return; }
            rpc("friend_request_answer", { p_name: s.name, p_hash: s.hash, p_id: req.id, p_accept: true }).then(function (d) {
                close();
                if (d && d.ok) systemNote("已同意 " + req.from + " 的好友申请。");
            }).catch(function () { close(); });
        });

        setTimeout(function () { if (document.body.contains(mask)) close(); }, 30000);
    }

    /* ---------- 收到邀请：弹窗（30 秒有效） ---------- */
    var inviteShowing = false;

    function showInvite(inv) {
        if (!inv || inviteShowing) return;
        inviteShowing = true;

        var mask = document.createElement("div");
        mask.className = "chat-modal show";
        mask.innerHTML = '<div class="box" style="max-width:340px">' +
            '<div class="h"><b>收到 1v1 邀请</b></div>' +
            '<div class="s" style="font-size:13px;line-height:2;color:#dbe9fb">' +
            '<b id="invFrom" style="color:#7dd3fc;font-weight:normal"></b> 邀请你进房间 ' +
            '<b id="invRoom" style="color:#7dd3fc;font-weight:normal"></b>。<br><span style="opacity:.6">30 秒内有效。</span>' +
            '</div>' +
            '<div class="s" style="display:flex;gap:10px;padding-bottom:16px">' +
            '<button class="chat-btn" id="invYes" style="flex:1;background:rgba(56,189,248,.18)">接 受</button>' +
            '<button class="chat-btn" id="invNo" style="flex:1">拒 绝</button>' +
            '</div></div>';
        document.body.appendChild(mask);

        mask.querySelector("#invFrom").textContent = inv.from;
        mask.querySelector("#invRoom").textContent = inv.room;

        function close() { mask.remove(); inviteShowing = false; }

        mask.querySelector("#invNo").addEventListener("click", function () {
            var s = me();
            if (s) rpc("invite_answer", { p_name: s.name, p_hash: s.hash, p_id: inv.id, p_accept: false });
            close();
        });

        mask.querySelector("#invYes").addEventListener("click", function () {
            var s = me();
            if (!s) { close(); return; }
            rpc("invite_answer", { p_name: s.name, p_hash: s.hash, p_id: inv.id, p_accept: true }).then(function (d) {
                close();
                if (d && d.ok) openChat(d.room, "房间 " + d.room);
            }).catch(function () { close(); });
        });

        setTimeout(function () { if (document.body.contains(mask)) close(); }, 30000);
    }

    /* 每 6 秒问一次：有没有人邀请我 */
    (function watchInvites() {
        var s = me();
        if (!s) return;
        setInterval(function () {
            if (inviteShowing) return;
            rpc("invite_pending", { p_name: s.name, p_hash: s.hash }).then(function (d) {
                if (d && d.ok && d.invite) showInvite(d.invite);
            }).catch(function () {});

            rpc("friend_request_pending", { p_name: s.name, p_hash: s.hash }).then(function (d) {
                if (d && d.ok && d.request && !friendReqShowing) showFriendRequest(d.request);
            }).catch(function () {});

            rpc("friend_request_result", { p_name: s.name, p_hash: s.hash }).then(function (d) {
                if (d && d.ok && d.result) {
                    alert(d.result.to + (d.result.accepted ? " 同意了你的好友申请。" : " 拒绝了你的好友申请。"));
                }
            }).catch(function () {});

            rpc("invite_take", { p_name: s.name, p_hash: s.hash }).then(function (d) {
                if (!d || !d.ok) return;

                if (d.status === "accepted" && d.room) {
                    if (state.room !== d.room) {
                        openChat(d.room, "房间 " + d.room);
                        setTimeout(function () { systemNote("对方接受了邀请，你们现在在同一个房间。"); }, 600);
                    }
                } else if (d.status === "rejected") {
                    systemNote("对方拒绝了你的邀请。");
                }
            }).catch(function () {});
        }, 6000);
    })();

    /* 给好友页用的接口 */
    window.ChatAPI = {
        me: me,
        rpc: rpc,
        escapeHtml: escapeHtml,
        openChat: openChat,
        invite: inviteFriend,
        showOnline: showOnline
    };
})();
