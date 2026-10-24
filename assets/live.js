/* 在线人数 + 注册人数小挂件 —— 所有页面共用
   逻辑：每 45 秒向 Supabase 报一次「我还活着」，顺便拿回在线数和注册数。
   90 秒没有心跳就算离线（所以数字会上下浮动，这是正常的）。 */
(function () {
    "use strict";

    if (window.__liveWidgetLoaded) return;
    window.__liveWidgetLoaded = true;

    var SB_URL = window.SUPABASE_PROXY || "https://wjvwupcquwjoajdvinkx.supabase.co";
    var SB_KEY = "sb_publishable_Wy3IyDHb-0yFAuRHbxuLFw_obIXU3OI";

    var DEVICE_KEY = "coffee-device-id";

    function deviceId() {
        var id = null;
        try { id = localStorage.getItem(DEVICE_KEY); } catch (e) {}
        if (!id) {
            id = "u" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
            try { localStorage.setItem(DEVICE_KEY, id); } catch (e) {}
        }
        return id;
    }

    var box = document.createElement("div");
    box.className = "live-widget";
    box.innerHTML = '<span class="live-dot"></span><span class="live-text">在线 — · 注册 —</span>';
    document.body.appendChild(box);

    var gold = location.pathname.indexOf("coffee-site") >= 0;
    var dotColor = gold ? "#c9a86a" : "#38bdf8";
    var lineColor = gold ? "rgba(201,168,106,.24)" : "rgba(56,189,248,.22)";
    var bgColor = gold ? "rgba(20,16,14,.78)" : "rgba(10,16,30,.72)";
    var textColor = gold ? "#d8c7a8" : "#9fb6d4";
    var strongColor = gold ? "#e8d6b4" : "#7dd3fc";

    var css = document.createElement("style");
    css.textContent =
        ".live-widget{position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:55;display:flex;align-items:center;gap:8px;padding:7px 16px;border-radius:999px;border:1px solid rgba(56,189,248,.22);background:rgba(10,16,30,.72);backdrop-filter:blur(8px);color:#9fb6d4;font-size:12px;letter-spacing:1px;white-space:nowrap;pointer-events:none;font-family:'Microsoft YaHei',sans-serif}" +
        ".live-widget .live-dot{width:7px;height:7px;border-radius:50%;background:" + dotColor + ";box-shadow:0 0 8px " + dotColor + "88;animation:livePulse 2s infinite}" +
        "@keyframes livePulse{0%,100%{opacity:1}50%{opacity:.35}}" +
        ".live-widget b{color:" + strongColor + ";font-weight:normal}" +
        "@media (max-width:520px){.live-widget{bottom:10px;font-size:11px;padding:6px 12px;letter-spacing:0}.live-widget b{font-size:11px}}";
    document.head.appendChild(css);

    var text = box.querySelector(".live-text");

    function ping() {
        if (typeof fetch !== "function") return;
        fetch(SB_URL + "/rest/v1/rpc/heartbeat", {
            method: "POST",
            headers: { "apikey": SB_KEY, "Authorization": "Bearer " + SB_KEY, "Content-Type": "application/json" },
            body: JSON.stringify({ p_device: deviceId() })
        })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (d) {
            if (!d) return;
            if (typeof d.members === "number") {
                var guests = Math.max(0, d.online - d.members);
                text.innerHTML = "在线 <b>" + d.online + "</b>（正式 <b>" + d.members + "</b> · 游客 <b>" + guests + "</b>）· 注册 <b>" + d.users + "</b>";
            } else {
                text.innerHTML = "在线 <b>" + d.online + "</b> · 注册 <b>" + d.users + "</b>";
            }
        })
        .catch(function () { /* 连不上就保持 — */ });
    }

    ping();
    setInterval(ping, 45000);
})();
