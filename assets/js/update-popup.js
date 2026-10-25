/* 更新日志弹窗 —— 先问「想看哪一类」，再显示具体内容
   数据来自根目录的「CHANGELOG.txt」，按访客设备上的今天取条目。
   分类规则：以「咖啡店」开头的算咖啡店，其余（知识库 / 语言学习 / 全站）算知识页。 */
(function () {
  "use strict";

  if (window.__updatePopupLoaded) return;
  window.__updatePopupLoaded = true;

  function pad(n) {
    return n < 10 ? "0" + n : "" + n;
  }

  function todayStr() {
    var d = new Date();
    return (
      d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate())
    );
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
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function seenKey(date) {
    return "up-seen-" + date;
  }

  var today = todayStr();
  try {
    if (sessionStorage.getItem(seenKey(today))) return;
  } catch (e) {}

  var here = document.currentScript
    ? document.currentScript.src
    : location.href;
  var txtUrl = new URL("../../CHANGELOG.txt", here).href;

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
    .catch(function () {
      /* 读不到日志就不打扰，页面照常用 */
    });

  function show(lines) {
    try {
      sessionStorage.setItem(seenKey(today), "1");
    } catch (e) {}

    var gold = location.pathname.indexOf("coffee-site") >= 0;
    var accent = gold ? "#c9a86a" : "#38bdf8";
    var panel = gold ? "#14100e" : "#0a1120";
    var text = gold ? "#e8dcc8" : "#d7e5f5";

    /* 分类 */
    var coffee = [];
    var hub = [];
    (lines || []).forEach(function (line) {
      if (line.indexOf("咖啡店") === 0) coffee.push(line);
      else hub.push(line);
    });

    var wrap = document.createElement("div");
    wrap.className = "up-mask";

    var css = document.createElement("style");
    css.textContent =
      ".up-mask{position:fixed;inset:0;z-index:900;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(0,0,0,.62);opacity:0;transition:opacity .25s}" +
      ".up-mask.show{opacity:1}" +
      ".up-card{width:100%;max-width:420px;max-height:86vh;display:flex;flex-direction:column;background:" +
      panel +
      ";border:1px solid " +
      accent +
      "44;border-radius:14px;padding:24px 22px 18px;box-shadow:0 24px 60px rgba(0,0,0,.55);transform:translateY(14px);transition:transform .28s}" +
      ".up-mask.show .up-card{transform:translateY(0)}" +
      ".up-notice{margin:0 0 18px;padding:11px 13px;border:1px solid " +
      accent +
      "33;border-radius:8px;background:" +
      accent +
      "0d;color:" +
      text +
      ";font-size:11.5px;line-height:1.85;letter-spacing:.3px}" +
      ".up-kicker{margin:0 0 14px;font-size:12px;letter-spacing:3px;color:" +
      accent +
      "}" +
      ".up-ask{margin:0 0 14px;color:" +
      text +
      ";font-size:14px;line-height:1.9}" +
      ".up-tabs{display:flex;gap:10px;flex-wrap:wrap;margin:0 0 8px}" +
      ".up-tab{flex:1 1 40%;padding:14px 10px;border:1px solid " +
      accent +
      "66;border-radius:10px;background:none;color:" +
      text +
      ";font-family:inherit;font-size:13.5px;letter-spacing:2px;cursor:pointer;transition:.2s}" +
      ".up-tab:hover{background:" +
      accent +
      "18;border-color:" +
      accent +
      "}" +
      ".up-tab:disabled{opacity:.35;cursor:not-allowed}" +
      ".up-tab small{display:block;margin-top:5px;font-size:11px;letter-spacing:1px;opacity:.65}" +
      ".up-skip{display:block;width:100%;margin-top:6px;padding:8px;border:0;background:none;color:" +
      accent +
      "99;font-family:inherit;font-size:12px;letter-spacing:1px;cursor:pointer;text-decoration:underline}" +
      ".up-skip:hover{color:" +
      accent +
      "}" +
      ".up-list{flex:1 1 auto;min-height:0;max-height:46vh;overflow-y:auto;margin:0 0 16px;padding:0 8px 0 18px;color:" +
      text +
      ";font-size:14px;line-height:1.9}" +
      ".up-list::-webkit-scrollbar{width:5px}" +
      ".up-list::-webkit-scrollbar-thumb{background:" +
      accent +
      "55;border-radius:5px}" +
      "@media (max-height:620px){.up-list{max-height:34vh}}" +
      ".up-none{margin:0 0 16px;color:" +
      text +
      ";font-size:14px;line-height:1.9}" +
      ".up-contact{flex:0 0 auto;margin:0 0 16px;font-size:12px;color:rgba(200,210,225,.5)}" +
      ".up-contact a{color:" +
      accent +
      ";text-decoration:none;border-bottom:1px solid " +
      accent +
      "55}" +
      ".up-actions{display:flex;gap:10px}" +
      ".up-ok{flex:1;padding:11px;border:1px solid " +
      accent +
      ";border-radius:8px;background:none;color:" +
      accent +
      ";font-family:inherit;font-size:14px;letter-spacing:2px;cursor:pointer}" +
      ".up-ok:hover{background:" +
      accent +
      "1a}" +
      ".up-back{flex:0 0 auto;padding:11px 14px;border:1px solid " +
      accent +
      "44;border-radius:8px;background:none;color:" +
      text +
      ";font-family:inherit;font-size:12.5px;letter-spacing:1px;cursor:pointer}" +
      ".up-back:hover{border-color:" +
      accent +
      "}";

    document.head.appendChild(css);
    document.body.appendChild(wrap);

    var closed = false;
    function close() {
      if (closed) return;
      closed = true;
      wrap.classList.remove("show");
      setTimeout(function () {
        if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
      }, 260);
    }

    function notice() {
      return '<p class="up-notice">本网站及代码在 Git 上均开源，且将一直免费 FREE！本站仅供大学生或需要参加考试的社会人士参考学习使用。任何人都可以模仿、参考、学习，但请勿用于商业用途，或做出违反互联网法律等违规的事情！<br/>语言学习项目已上线 Python / Java / C / JavaScript 四门课程。</p>';
    }

    /* 第一步：先问想看哪一类 */
    function renderChooser() {
      wrap.innerHTML =
        '<div class="up-card" role="dialog" aria-modal="true" aria-label="今日公告">' +
        notice() +
        '<p class="up-kicker">今 日 公 告 · ' +
        today +
        "</p>" +
        '<p class="up-ask">今天更新了两类内容，想看哪一边？</p>' +
        '<div class="up-tabs">' +
        '<button class="up-tab" data-cat="coffee"' +
        (coffee.length ? "" : " disabled") +
        ">" +
        "咖啡店<small>" +
        (coffee.length ? coffee.length + " 条更新" : "今天没有") +
        "</small>" +
        "</button>" +
        '<button class="up-tab" data-cat="hub"' +
        (hub.length ? "" : " disabled") +
        ">" +
        "知识页<small>" +
        (hub.length ? hub.length + " 条更新" : "今天没有") +
        "</small>" +
        "</button>" +
        "</div>" +
        '<button class="up-skip" type="button">不想看，直接进站</button>' +
        "</div>";

      var btns = wrap.querySelectorAll(".up-tab");
      for (var i = 0; i < btns.length; i++) {
        btns[i].addEventListener("click", function () {
          renderList(this.getAttribute("data-cat"));
        });
      }
      wrap.querySelector(".up-skip").addEventListener("click", close);
    }

    /* 第二步：显示选中的那一类 */
    function renderList(cat) {
      var isCoffee = cat === "coffee";
      var list = isCoffee ? coffee : hub;
      var label = isCoffee ? "咖啡店" : "知识页";

      var body = "";
      if (list.length) {
        body += '<ul class="up-list">';
        for (var i = 0; i < list.length; i++) {
          /* 去掉开头的「咖啡店：」/「知识库：」，看起来更干净 */
          var line = list[i].replace(/^[^：]*：/, "");
          body += "<li>" + esc(line) + "</li>";
        }
        body += "</ul>";
      } else {
        body += '<p class="up-none">这一类今天没有更新。</p>';
      }

      wrap.innerHTML =
        '<div class="up-card" role="dialog" aria-modal="true" aria-label="今日公告">' +
        notice() +
        '<p class="up-kicker">' +
        label +
        " · " +
        today +
        "</p>" +
        body +
        '<p class="up-contact">有想法、发现 bug、想催更 —— <a href="mailto:hyyzcn0115@163.com">hyyzcn0115@163.com</a> · 龙潜猫隐</p>' +
        '<div class="up-actions">' +
        '<button class="up-back" type="button">← 换个分类</button>' +
        '<button class="up-ok" type="button">知 道 了</button>' +
        "</div>" +
        "</div>";

      wrap.querySelector(".up-back").addEventListener("click", renderChooser);
      wrap.querySelector(".up-ok").addEventListener("click", close);
    }

    /* 今天没有更新：沿用原来那句 */
    function renderEmpty() {
      wrap.innerHTML =
        '<div class="up-card" role="dialog" aria-modal="true" aria-label="今日公告">' +
        notice() +
        '<p class="up-kicker">今 日 · ' +
        today +
        "</p>" +
        '<p class="up-none">今日无更新，快提供你的想法联系制作者更新，催他学习吧！</p>' +
        '<p class="up-contact">有想法、发现 bug、想催更 —— <a href="mailto:hyyzcn0115@163.com">hyyzcn0115@163.com</a> · 龙潜猫隐</p>' +
        '<div class="up-actions"><button class="up-ok" type="button">知 道 了</button></div>' +
        "</div>";
      wrap.querySelector(".up-ok").addEventListener("click", close);
    }

    if (!lines) renderEmpty();
    else renderChooser();

    setTimeout(function () {
      wrap.classList.add("show");
    }, 30);

    wrap.addEventListener("click", function (e) {
      if (e.target === wrap) close();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") close();
    });
  }
})();
