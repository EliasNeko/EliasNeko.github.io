  /* ==========================================================
    小鱼课堂 · 知识清单数据源
    新增一期：在 LESSONS 里加一条即可。
    kind: "base" 表示置顶的基础篇，不参与「上一期/下一期」的链条。
    ========================================================== */

(function () {
  "use strict";

  var LESSONS = [
    {
      n: 0,
      kind: "base",
      date: "2026-10-21",
      title: "HTML5 + CSS + JavaScript 基础全书",
      file: "基础知识.html",
      points: 50,
      pits: 0,
      tags: ["标签与属性", "选择器", "布局", "交互", "长期置顶"],
      desc: "三个语言怎么分工、怎么融合，标签 / 属性 / 值 / 选择器 / DOM 全在这份里。随时回来查。"
    },
    {
      n: 1,
      kind: "lesson",
      date: "2026-10-20",
      title: "从「一个网页」到「一屏首页」",
      file: "知识点清单-001-2026-10-20.html",
      points: 16,
      pits: 6,
      tags: ["HTML 骨架", "选择器", "Flex", "Grid"]
    },
    {
      n: 2,
      kind: "lesson",
      date: "2026-10-21",
      title: "从「一屏」到「一整页」",
      file: "知识点清单-002-2026-10-21.html",
      points: 17,
      pits: 5,
      tags: ["Grid 复用", ":not()", "中文排版", "页脚"]
    },
    {
      n: 3,
      kind: "lesson",
      date: "2026-10-22",
      title: "从「点一下」到「记得你」",
      file: "知识点清单-003-2026-10-22.html",
      points: 17,
      pits: 5,
      tags: ["事件委托", "localStorage", "JSON", "渲染", "作用域", "z-index"]
    }
  ];

  window.LESSONS = LESSONS;

  var PROJECTS = [
    {
      title: "龙潜猫隐和小鱼dpsk的咖啡店",
      desc: "首屏、导航、菜单、故事、门店、页脚，六屏齐全，四个锚点全通；购物车、购买、每杯一个咖啡故事页，都已上线。",
      tags: ["HTML5", "CSS", "第一个作品"],
      links: [{ label: "打开网站", href: "../coffee-site/index.html" }]
    }
  ];

  window.PROJECTS = PROJECTS;

  function pad(n) {
    return String(n).padStart(3, "0");
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function lessonsOnly() {
    return LESSONS.filter(function (l) { return l.kind !== "base"; });
  }

  /* ---------------- 设备识别 ---------------- */

  function deviceInfo() {
    var ua = navigator.userAgent;
    var os = "未知系统";

    if (/Windows NT 10/.test(ua)) os = "Windows 10/11";
    else if (/Windows NT 6\.3/.test(ua)) os = "Windows 8.1";
    else if (/Windows/.test(ua)) os = "Windows";
    else if (/Android\s*([\d.]+)?/.test(ua)) os = "Android" + (RegExp.$1 ? " " + RegExp.$1 : "");
    else if (/iPad/.test(ua)) os = "iPadOS";
    else if (/iPhone|iPod/.test(ua)) os = "iOS";
    else if (/Mac OS X/.test(ua)) os = "macOS";
    else if (/CrOS/.test(ua)) os = "ChromeOS";
    else if (/Linux/.test(ua)) os = "Linux";

    var browser = "浏览器";
    var m;
    if ((m = ua.match(/Edg\/(\d+)/))) browser = "Edge " + m[1];
    else if ((m = ua.match(/OPR\/(\d+)/))) browser = "Opera " + m[1];
    else if ((m = ua.match(/Firefox\/(\d+)/))) browser = "Firefox " + m[1];
    else if ((m = ua.match(/Chrome\/(\d+)/))) browser = "Chrome " + m[1];
    else if ((m = ua.match(/Version\/(\d+).*Safari/))) browser = "Safari " + m[1];

    var w = window.screen.width;
    var h = window.screen.height;
    var touch = ("ontouchstart" in window) || (navigator.maxTouchPoints > 0);
    var type = touch ? (Math.min(w, h) < 768 ? "手机" : "平板") : "桌面端";

    return { os: os, browser: browser, w: w, h: h, type: type, ua: ua };
  }

  window.renderDevice = function (elId) {
    var el = document.getElementById(elId);
    if (!el) return;
    var d = deviceInfo();
    el.textContent = d.os + " · " + d.browser + " · " + d.w + " × " + d.h + " · " + d.type;

    if (navigator.userAgentData && navigator.userAgentData.getHighEntropyValues) {
      navigator.userAgentData.getHighEntropyValues(["model", "platformVersion"])
        .then(function (v) {
          var parts = [d.os];
          if (v.model) parts.push(v.model);
          parts.push(d.browser, d.w + " × " + d.h, d.type);
          el.textContent = parts.join(" · ");
        })
        .catch(function () {});
    }
  };

  /* ---------------- 清单页 ---------------- */

  window.renderLessonNav = function (currentFile) {
    var all = lessonsOnly();
    var idx = -1;
    for (var i = 0; i < all.length; i++) {
      if (all[i].file === currentFile) { idx = i; break; }
    }
    var isBase = currentFile === "基础知识.html";
    var cur = idx > -1 ? all[idx] : null;
    var prev = idx > 0 ? all[idx - 1] : null;
    var next = idx > -1 && idx < all.length - 1 ? all[idx + 1] : null;

    /* 自动生成侧边目录 */
    var toc = document.querySelector(".toc");
    if (toc && toc.getAttribute("data-auto") === "true" && !toc.querySelector("a")) {
      var secs = document.querySelectorAll("main section.card");
      for (var s = 0; s < secs.length; s++) {
        if (!secs[s].id) continue;
        var h2 = secs[s].querySelector("h2");
        if (!h2) continue;
        var clone = h2.cloneNode(true);
        var numEl = clone.querySelector(".num");
        var num = numEl ? numEl.textContent : "";
        if (numEl) clone.removeChild(numEl);
        var label = (num ? num + " " : "") + clone.textContent.trim();

        var a = document.createElement("a");
        a.href = "#" + secs[s].id;
        a.textContent = label;
        a.title = label;
        a.style.cssText = "white-space:nowrap;overflow:hidden;text-overflow:ellipsis;";
        toc.appendChild(a);
      }
    }

    /* 进度条 */
    var bar = document.createElement("div");
    bar.className = "progress";
    document.body.appendChild(bar);

    function onScroll() {
      var el = document.documentElement;
      var max = el.scrollHeight - el.clientHeight;
      bar.style.width = (max > 0 ? (el.scrollTop / max) * 100 : 0) + "%";
    }
    document.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();

    /* 底部悬浮导航 */
    var dock = document.createElement("div");
    dock.className = "dock";

    var home = document.createElement("a");
    home.className = "home";
    home.href = "index.html";
    home.textContent = "目录";
    dock.appendChild(home);

    if (prev) {
      var a1 = document.createElement("a");
      a1.href = prev.file;
      a1.textContent = "←";
      a1.title = "上一期：" + prev.title;
      dock.appendChild(a1);
    } else {
      var d1 = document.createElement("span");
      d1.className = "disabled";
      d1.textContent = "←";
      dock.appendChild(d1);
    }

    var pos = document.createElement("span");
    pos.className = "pos";
    pos.textContent = isBase ? "基础篇" : (cur ? pad(cur.n) + " / " + pad(all[all.length - 1].n) : "");
    dock.appendChild(pos);

    if (next) {
      var a2 = document.createElement("a");
      a2.href = next.file;
      a2.textContent = "→";
      a2.title = "下一期：" + next.title;
      dock.appendChild(a2);
    } else {
      var d2 = document.createElement("span");
      d2.className = "disabled";
      d2.textContent = "→";
      dock.appendChild(d2);
    }

    document.body.appendChild(dock);

    /* 键盘翻页 */
    document.addEventListener("keydown", function (e) {
      if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
      if (e.key === "ArrowLeft" && prev) location.href = prev.file;
      if (e.key === "ArrowRight" && next) location.href = next.file;
    });

    /* 代码复制 */
    var pres = document.querySelectorAll("pre");
    for (var k = 0; k < pres.length; k++) {
      (function (pre) {
        if (pre.querySelector(".code-copy")) return;
        var btn = document.createElement("button");
        btn.className = "code-copy";
        btn.type = "button";
        btn.textContent = "复制";
        btn.addEventListener("click", function () {
          var codeEl = pre.querySelector("code") || pre;
          var text = codeEl.innerText;
          function done() {
            btn.textContent = "已复制";
            btn.classList.add("done");
            setTimeout(function () {
              btn.textContent = "复制";
              btn.classList.remove("done");
            }, 1600);
          }
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(done, function () {});
          } else {
            var ta = document.createElement("textarea");
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            try { document.execCommand("copy"); done(); } catch (err) {}
            document.body.removeChild(ta);
          }
        });
        pre.appendChild(btn);
      })(pres[k]);
    }

    /* 目录高亮 */
    var links = document.querySelectorAll(".toc a");
    var sections = document.querySelectorAll("main section.card");
    if (links.length && sections.length && "IntersectionObserver" in window) {
      var map = {};
      for (var m = 0; m < links.length; m++) {
        var href = links[m].getAttribute("href") || "";
        map[href.replace("#", "")] = links[m];
      }
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            for (var key in map) map[key].classList.remove("active");
            var link = map[en.target.id];
            if (link) link.classList.add("active");
          }
        });
      }, { rootMargin: "-15% 0px -70% 0px", threshold: 0 });
      for (var t = 0; t < sections.length; t++) io.observe(sections[t]);
    }
  };

  /* ---------------- 目录页 ---------------- */

  window.renderIndex = function () {
    var grid = document.getElementById("idx-grid");
    if (!grid) return;

    var lessons = lessonsOnly();
    var totalPoints = 0;
    var totalPits = 0;
    lessons.forEach(function (l) {
      totalPoints += l.points || 0;
      totalPits += l.pits || 0;
    });

    var base = LESSONS.filter(function (l) { return l.kind === "base"; });
    var sorted = lessons.slice().sort(function (a, b) { return a.n - b.n; });
    var all = base.concat(sorted);

    var c1 = document.getElementById("stat-count");
    var c2 = document.getElementById("stat-points");
    var c3 = document.getElementById("stat-pits");
    if (c1) c1.textContent = lessons.length;
    if (c2) c2.textContent = totalPoints;
    if (c3) c3.textContent = totalPits;

    var newest = lessons.reduce(function (a, b) { return b.n > a.n ? b : a; }, lessons[0]);

    function card(l) {
      var isBase = l.kind === "base";
      var tags = (l.tags || []).map(function (t) {
        return "<span>" + esc(t) + "</span>";
      }).join("");

      return '' +
        '<a class="lesson-card' + (isBase ? " pinned" : "") + '"' +
          ' data-search="' + esc(((l.title || "") + " " + (l.date || "") + " " + (l.tags || []).join(" ") + " " + (l.desc || "") + " " + (l.file || "")).toLowerCase()) + '"' +
          ' href="' + esc(l.file) + '">' +
          (isBase
            ? '<span class="badge-pin">置顶 · 基础篇</span>'
            : (l.n === newest.n ? '<span class="badge-new">最新</span>' : "")) +
          '<div class="lesson-top">' +
            '<span class="lesson-no">' + (isBase ? "BASE" : pad(l.n)) + "</span>" +
            '<span class="lesson-date">' + esc(l.date) + "</span>" +
          "</div>" +
          "<h3>" + esc(l.title) + "</h3>" +
          (l.desc ? '<p style="color:var(--muted);font-size:13.5px;line-height:1.9;position:relative;">' + esc(l.desc) + "</p>" : "") +
          '<div class="lesson-tags">' + tags + "</div>" +
          '<div class="lesson-foot">' +
            "<span>" + (isBase ? "50 个基础点 · 长期可查" : (l.points || 0) + " 个知识点 · " + (l.pits || 0) + " 个坑") + "</span>" +
            '<span class="go">翻开 →</span>' +
          "</div>" +
        "</a>";
    }

    var projBox = document.getElementById("idx-projects");
    if (projBox) {
      projBox.innerHTML = PROJECTS.map(function (p) {
        var tags = (p.tags || []).map(function (t) {
          return "<span>" + esc(t) + "</span>";
        }).join("");
        var links = (p.links || []).map(function (a) {
          return '<a href="' + esc(a.href) + '">' + esc(a.label) + " →</a>";
        }).join("");
        var hay = ((p.title || "") + " " + (p.desc || "") + " " + (p.tags || []).join(" ")).toLowerCase();

        return '' +
          '<div class="lesson-card project" data-search="' + esc(hay) + '">' +
            '<span class="badge-proj">项目</span>' +
            '<div class="lesson-top">' +
              '<span class="lesson-no">PROJECT</span>' +
              '<span class="lesson-date">进行中</span>' +
            "</div>" +
            "<h3>" + esc(p.title) + "</h3>" +
            '<p style="color:var(--muted);font-size:13.5px;line-height:1.9;position:relative;">' + esc(p.desc) + "</p>" +
            '<div class="lesson-tags">' + tags + "</div>" +
            '<div class="proj-actions">' + links + "</div>" +
          "</div>";
      }).join("");
    }

    grid.innerHTML = all.map(card).join("");

    var input = document.getElementById("idx-search");
    if (input) {
      input.addEventListener("input", function () {
        var q = this.value.trim().toLowerCase();
        var shown = 0;
        var nodes = document.querySelectorAll(".lesson-card");
        for (var i = 0; i < nodes.length; i++) {
          var hay = (nodes[i].getAttribute("data-search") || "").toLowerCase();
          var hit = !q || hay.indexOf(q) > -1;
          nodes[i].style.display = hit ? "" : "none";
          if (hit) shown++;
        }
        var empty = document.getElementById("idx-empty");
        if (empty) empty.style.display = shown ? "none" : "block";
      });
    }
  };
  /* ---------------- 鼠标聚光 ---------------- */

  function initSpotlight() {
    if (!window.matchMedia || !window.matchMedia("(hover: hover)").matches) return;

    var sel = ".card, .kw-card, .lesson-card";
    var frame = 0;
    var last = null;

    document.addEventListener("pointermove", function (e) {
      var el = e.target && e.target.closest ? e.target.closest(sel) : null;
      if (!el) return;
      last = { el: el, x: e.clientX, y: e.clientY };

      if (!frame) {
        frame = requestAnimationFrame(function () {
          frame = 0;
          if (!last) return;
          var r = last.el.getBoundingClientRect();
          last.el.style.setProperty("--mx", (last.x - r.left) + "px");
          last.el.style.setProperty("--my", (last.y - r.top) + "px");
        });
      }
    }, { passive: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSpotlight);
  } else {
    initSpotlight();
  }
})();
