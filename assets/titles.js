/* 头衔系统 · 2026-10-23
   - 普通头衔：Lv0 / Lv1，无特效
   - 活动头衔：Lv2–Lv6，特效 1–3 级；Lv5 是特效 3，Lv6 是 3+（最高）
   - 站长亲封：传说级，目前有「站长」和「申鹤的🐶」
   使用时长由聊天室脚本在每一页累计，存在本机。 */
(function () {
    "use strict";
    if (window.Titles) return;

    var OWNER_NAME = "龙潜猫隐";
    var LEVELS = [
        { lv: 0, name: "Lv0 · 初来乍到", min: 0, fx: 0, icon: "" },
        { lv: 1, name: "Lv1 · 熟客", min: 1, fx: 0, icon: "" },
        { lv: 2, name: "Lv2 · 常驻客人", min: 10, fx: 1, icon: "☕" },
        { lv: 3, name: "Lv3 · 咖啡搭子", min: 30, fx: 1, icon: "☕" },
        { lv: 4, name: "Lv4 · 深夜常客", min: 80, fx: 2, icon: "🌙" },
        { lv: 5, name: "Lv5 · 老主顾", min: 300, fx: 3, icon: "⭐" },
        { lv: 6, name: "Lv6 · 镇店之友", min: 8760, fx: "3c", icon: "♛" }
    ];

    var SPECIAL = {
        "龙潜猫隐": [
            { id: "sealed-owner", name: "站长", cat: "sealed", fx: "owner", tone: "gold", icon: "♛" },
            { id: "sealed-lolic", name: "loli控", cat: "sealed", fx: "legend", tone: "blue-purple", icon: "✦" }
        ],
        "时雨": [{ id: "sealed-shenhe", name: "申鹤的🐶", cat: "sealed", fx: "legend", tone: "purple", icon: "❄" }]
    };

    var CAT_LABEL = { normal: "普通头衔", activity: "活动头衔", sealed: "站长亲封" };
    var FX_LABEL = { 0: "无特效", 1: "特效 1 · 微光", 2: "特效 2 · 流光", 3: "特效 3 · 星辉", "3c": "特效 3+ · 星辉冠冕", legend: "传说 · 站长亲封" };
    var USAGE_PREFIX = "coffee-usage-v1:";
    var PICK_PREFIX = "coffee-titles-selected-v1:";
    var GRANT_KEY = "coffee-grants-v1";
    var CLOUD_TITLES = {};
    var SB_URL = window.SUPABASE_URL || "https://wjvwupcquwjoajdvinkx.supabase.co";
    var SB_KEY = window.SUPABASE_KEY || "sb_publishable_Wy3IyDHb-0yFAuRHbxuLFw_obIXU3OI";

    function esc(s) {
        return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
            return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
        });
    }

    function usageKey(name) { return USAGE_PREFIX + name; }
    function pickKey(name) { return PICK_PREFIX + name; }

    function usageSeconds(name) {
        var n = 0;
        try { n = parseFloat(localStorage.getItem(usageKey(name))) || 0; } catch (e) {}
        return n > 0 ? n : 0;
    }

    function usageHours(name) { return usageSeconds(name) / 3600; }

    function levelOf(name) {
        var h = usageHours(name);
        var cur = LEVELS[0];
        for (var i = 0; i < LEVELS.length; i++) {
            if (h >= LEVELS[i].min) cur = LEVELS[i];
        }
        return cur;
    }

    function categoryOf(lv) { return lv <= 1 ? "normal" : "activity"; }

    function readGrants() {
        try {
            var raw = localStorage.getItem(GRANT_KEY);
            var v = raw ? JSON.parse(raw) : {};
            return (v && typeof v === "object") ? v : {};
        } catch (e) { return {}; }
    }

    function grantsFor(name) {
        var g = readGrants()[name];
        return Object.prototype.toString.call(g) === "[object Array]" ? g : [];
    }

    function cloudSpecials(name) {
        return CLOUD_TITLES[name] || [];
    }

    function loadCloud() {
        if (typeof fetch !== "function") return Promise.resolve(CLOUD_TITLES);
        return fetch(SB_URL + "/rest/v1/rpc/titles_all", {
            method: "POST",
            headers: { "apikey": SB_KEY, "Authorization": "Bearer " + SB_KEY, "Content-Type": "application/json" },
            body: "{}"
        }).then(function (r) { return r.ok ? r.json() : []; }).then(function (list) {
            var map = {};
            for (var i = 0; i < (list || []).length; i++) {
                var t = list[i];
                if (!t || !t.user || !t.name) continue;
                if (!map[t.user]) map[t.user] = [];
                map[t.user].push({
                    id: t.id,
                    name: t.name,
                    cat: "sealed",
                    fx: "legend",
                    tone: t.tone || "purple",
                    icon: t.icon || "✦",
                    cloud: true
                });
            }
            CLOUD_TITLES = map;
            return map;
        }).catch(function () { return CLOUD_TITLES; });
    }

    function allSpecials(name) {
        return (SPECIAL[name] || []).concat(cloudSpecials(name)).concat(grantsFor(name));
    }

    function owned(name) {
        var lv = levelOf(name).lv;
        var out = [];
        for (var i = 0; i < LEVELS.length; i++) {
            var t = LEVELS[i];
            if (t.lv > lv) break;
            out.push({
                id: "lv" + t.lv,
                name: t.name,
                cat: categoryOf(t.lv),
                fx: t.fx,
                icon: t.icon,
                lv: t.lv,
                min: t.min
            });
        }
        var specials = allSpecials(name);
        for (var j = 0; j < specials.length; j++) out.push(specials[j]);
        return out;
    }

    function badgeHTML(t, size) {
        var cls = "title-chip fx-" + String(t.fx);
        if (t.tone) cls += " tone-" + t.tone;
        if (size === "lg") cls += " lg";
        return '<span class="' + cls + '" title="' + esc(t.name) + '">' +
            (t.icon ? '<span class="tc-ico" aria-hidden="true">' + t.icon + '</span>' : '') +
            esc(t.name) + "</span>";
    }

    function defaultPicks(name) {
        var all = owned(name);
        var picks = [];
        var specials = all.filter(function (t) { return t.cat === "sealed"; });
        var levels = all.filter(function (t) { return t.cat !== "sealed"; }).sort(function (a, b) { return b.lv - a.lv; });
        for (var i = 0; i < specials.length && picks.length < 2; i++) picks.push(specials[i]);
        if (picks.length < 2 && levels.length) picks.push(levels[0]);
        return picks;
    }

    function selected(name) {
        var all = owned(name);
        var byId = {};
        for (var i = 0; i < all.length; i++) byId[all[i].id] = all[i];

        var raw = null;
        try { raw = localStorage.getItem(pickKey(name)); } catch (e) {}
        if (raw !== null) {
            try {
                var ids = JSON.parse(raw);
                if (Object.prototype.toString.call(ids) === "[object Array]") {
                    var out = [];
                    for (var j = 0; j < ids.length && out.length < 2; j++) {
                        if (byId[ids[j]]) out.push(byId[ids[j]]);
                    }
                    return out;
                }
            } catch (e) {}
        }
        return defaultPicks(name);
    }

    function saveSelected(name, list) {
        var ids = [];
        for (var i = 0; i < list.length && ids.length < 2; i++) ids.push(list[i].id);
        try { localStorage.setItem(pickKey(name), JSON.stringify(ids)); } catch (e) {}
    }

    function nameHTML(name, size) {
        return esc(name) + badgesHTML(name, size);
    }

    function badgesHTML(name, size) {
        var list = selected(name);
        var html = "";
        for (var i = 0; i < list.length; i++) html += badgeHTML(list[i], size);
        return html;
    }

    function fmtHours(h) {
        if (h < 1) return Math.max(0, Math.round(h * 60)) + " 分钟";
        if (h < 48) return (Math.round(h * 10) / 10) + " 小时";
        return (Math.round(h / 24 * 10) / 10) + " 天";
    }

    function renderPanel(name, mount) {
        if (!mount) return;
        var lv = levelOf(name);
        var hours = usageHours(name);
        var all = owned(name);
        var picked = selected(name);
        var pickedIds = {};
        for (var i = 0; i < picked.length; i++) pickedIds[picked[i].id] = true;

        var next = LEVELS[lv.lv + 1];
        var progress = next
            ? "距离 " + next.name + " 还差 " + fmtHours(Math.max(0, next.min - hours))
            : "已经到最高等级，谢谢你陪了这家店这么久";

        var html = '<div class="titles-head"><h2>我拥有的头衔</h2><span class="titles-count">已挂 <b id="titlesEquipped">' + picked.length + '</b> / 2</span></div>';
        html += '<p class="titles-usage">本机累计使用 <b>' + fmtHours(hours) + '</b> · 当前 <b>' + lv.name + '</b> · ' + progress + '</p>';
        html += '<p class="titles-msg" id="titlesMsg"></p>';

        var cats = ["normal", "activity", "sealed"];
        for (var c = 0; c < cats.length; c++) {
            var cat = cats[c];
            var list = all.filter(function (t) { return t.cat === cat; });
            html += '<div class="title-group"><h3>' + CAT_LABEL[cat] + '</h3>';
            if (!list.length) {
                html += '<p class="title-none">暂未拥有头衔</p>';
            } else {
                html += '<div class="title-list">';
                for (var k = 0; k < list.length; k++) {
                    var t = list[k];
                    var meta = t.cat === "sealed"
                        ? FX_LABEL[t.fx]
                        : (t.name.split(" · ")[0] + " · " + FX_LABEL[t.fx]);
                    html += '<button type="button" class="title-item' + (pickedIds[t.id] ? " on" : "") + '" data-title="' + t.id + '">' +
                        badgeHTML(t) +
                        '<span class="title-meta">' + esc(meta) + '</span>' +
                        '<span class="title-check">✓ 已挂</span>' +
                        '</button>';
                }
                html += '</div>';
            }
            html += '</div>';
        }

        html += '<p class="titles-footer">暂无更多头衔，待站长添加；想要专属头衔，可以 <a href="mailto:hyyzcn0115@163.com?subject=%E5%A4%B4%E8%A1%94%E5%BB%BA%E8%AE%AE">发邮件提建议</a>。</p>';
        mount.innerHTML = html;

        if (!mount.__titlesBound) {
            mount.__titlesBound = true;
            mount.addEventListener("click", function (e) {
                var item = e.target.closest ? e.target.closest(".title-item") : null;
                if (!item) return;
                var id = item.getAttribute("data-title");
                var cur = selected(name);
                var idx = -1;
                for (var i = 0; i < cur.length; i++) if (cur[i].id === id) { idx = i; break; }

                if (idx >= 0) {
                    cur.splice(idx, 1);
                } else {
                    if (cur.length >= 2) {
                        var m = document.getElementById("titlesMsg");
                        if (m) m.textContent = "最多只能挂 2 个头衔，先取消一个再选。";
                        return;
                    }
                    var all2 = owned(name);
                    for (var j = 0; j < all2.length; j++) if (all2[j].id === id) { cur.push(all2[j]); break; }
                }
                saveSelected(name, cur);
                renderPanel(name, mount);
                var nameEl = document.getElementById("name");
                if (nameEl) nameEl.innerHTML = nameHTML(name, "lg");
            });
        }
    }

    function sealedTone(name) {
        var sp = allSpecials(name);
        for (var i = 0; i < sp.length; i++) if (sp[i].tone) return sp[i].tone;
        return "";
    }

    /* 好友列表 / 聊天室只展示「站长亲封」，不展示对方私人的等级头衔 */
    function sealedBadgesHTML(name, size) {
        var list = allSpecials(name);
        var html = "";
        for (var i = 0; i < list.length; i++) html += badgeHTML(list[i], size);
        return html;
    }

    function sealedNameHTML(name, size) {
        return esc(name) + sealedBadgesHTML(name, size);
    }

    /* 站长工具：本机授予 / 撤销 */
    function grant(name, title) {
        var map = readGrants();
        var list = Object.prototype.toString.call(map[name]) === "[object Array]" ? map[name] : [];
        var id = title.id || ("grant-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 6));
        var item = {
            id: id,
            name: String(title.name || "").slice(0, 20),
            cat: "sealed",
            fx: "legend",
            tone: title.tone || "purple",
            icon: title.icon || "✦"
        };
        list.push(item);
        map[name] = list;
        try { localStorage.setItem(GRANT_KEY, JSON.stringify(map)); } catch (e) {}
        return item;
    }

    function revoke(name, id) {
        var map = readGrants();
        var list = Object.prototype.toString.call(map[name]) === "[object Array]" ? map[name] : [];
        map[name] = list.filter(function (t) { return t.id !== id; });
        try { localStorage.setItem(GRANT_KEY, JSON.stringify(map)); } catch (e) {}
    }

    window.Titles = {
        OWNER_NAME: OWNER_NAME,
        LEVELS: LEVELS,
        SPECIAL: SPECIAL,
        usageHours: usageHours,
        levelOf: levelOf,
        owned: owned,
        selected: selected,
        saveSelected: saveSelected,
        nameHTML: nameHTML,
        badgesHTML: badgesHTML,
        badgeHTML: badgeHTML,
        renderPanel: renderPanel,
        sealedTone: sealedTone,
        sealedBadgesHTML: sealedBadgesHTML,
        sealedNameHTML: sealedNameHTML,
        allSpecials: allSpecials,
        allGrants: function () { return readGrants(); },
        loadCloud: loadCloud,
        cloudTitles: function () { return CLOUD_TITLES; },
        grantsFor: grantsFor,
        grant: grant,
        revoke: revoke
    };
})();
