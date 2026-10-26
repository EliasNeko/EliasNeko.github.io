/* ============================================================
   个人主页 · 交互
   ------------------------------------------------------------
   1. 把 profile.js 里的字填进页面
   2. 开场三行字 + 进入按钮
   3. 滚动时一块一块浮上来
   4. 点链接先落幕布，再跳页面
   ============================================================ */
(function () {
    "use strict";

    var P = window.LQMY_PROFILE || {};
    var body = document.body;
    var doc = document;
    var reduced = false;

    try {
        reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch (e) {}

    /* ---------------- 1. 填字 ---------------- */

    function pick(path) {
        var cur = P;
        var keys = String(path).split(".");
        for (var i = 0; i < keys.length; i++) {
            if (cur === null || cur === undefined) return undefined;
            cur = cur[keys[i]];
        }
        return cur;
    }

    function fillText() {
        var nodes = doc.querySelectorAll("[data-p]");
        for (var i = 0; i < nodes.length; i++) {
            var v = pick(nodes[i].getAttribute("data-p"));
            if (typeof v === "string" && v.trim()) nodes[i].textContent = v;
        }
    }

    function buildChips() {
        var box = doc.getElementById("chips");
        if (!box) return;
        var list = P.chips || [];
        box.innerHTML = "";
        for (var i = 0; i < list.length; i++) {
            var el = doc.createElement("span");
            el.className = "chip";

            var ico = doc.createElement("b");
            ico.style.fontWeight = "400";
            ico.textContent = list[i].ico || "";

            var txt = doc.createElement("span");
            txt.textContent = list[i].text || "";

            el.appendChild(ico);
            el.appendChild(txt);
            box.appendChild(el);
        }
    }

    function buildInfo() {
        var box = doc.getElementById("info");
        if (!box) return;
        var rows = P.info || [];
        box.innerHTML = "";
        for (var i = 0; i < rows.length; i++) {
            var row = doc.createElement("div");
            row.className = "info-row";
            row.style.setProperty("--i", String(i));

            var key = doc.createElement("span");
            key.className = "info-key";
            key.textContent = rows[i].key || "";

            var val = doc.createElement("span");
            val.className = "info-val";
            if (rows[i].value) {
                val.textContent = rows[i].value;
            } else {
                val.classList.add("todo");
                var tag = doc.createElement("span");
                tag.className = "todo-tag";
                tag.textContent = "待补充";
                val.appendChild(tag);
            }

            row.appendChild(key);
            row.appendChild(val);
            box.appendChild(row);
        }
    }

    function buildBootLines() {
        var lines = (P.boot && P.boot.lines) || [];
        if (!lines.length) return;
        var nodes = doc.querySelectorAll("[data-boot-line] .boot-text");
        for (var i = 0; i < nodes.length && i < lines.length; i++) {
            if (lines[i]) nodes[i].textContent = lines[i];
        }
    }

    function buildGallery() {
        var box = doc.getElementById("artMore");
        if (!box) return;
        var list = (P.char && P.char.artworks) || [];
        box.innerHTML = "";
        if (!list.length) return;
        for (var i = 0; i < list.length; i++) {
            var a = doc.createElement("a");
            a.className = "art-card";
            a.href = list[i].src || "#";
            a.target = "_blank";
            a.rel = "noopener";
            var img = doc.createElement("img");
            img.src = list[i].src || "";
            img.alt = list[i].title || "龙潜猫隐 形象稿";
            img.loading = "lazy";
            var cap = doc.createElement("span");
            cap.textContent = list[i].title || "";
            a.appendChild(img);
            a.appendChild(cap);
            box.appendChild(a);
        }
        box.hidden = false;
    }

    function buildMore() {
        var box = doc.getElementById("moreList");
        if (!box) return;
        var list = P.more || [];
        box.innerHTML = "";
        for (var i = 0; i < list.length; i++) {
            var row = doc.createElement("div");
            row.className = "more-item";

            var k = doc.createElement("span");
            k.className = "more-key";
            k.textContent = list[i].key || "";

            var v = doc.createElement("span");
            v.className = "more-val";
            if (list[i].value) {
                v.textContent = list[i].value;
            } else {
                var tag = doc.createElement("span");
                tag.className = "todo-tag";
                tag.textContent = "待补充";
                v.appendChild(tag);
            }

            row.appendChild(k);
            row.appendChild(v);
            box.appendChild(row);
        }
    }

    function setupMore() {
        var wrap = doc.querySelector(".more");
        var btn = doc.getElementById("moreBtn");
        var panel = doc.getElementById("morePanel");
        var label = doc.getElementById("moreLabel");
        if (!wrap || !btn || !panel) return;

        btn.addEventListener("click", function () {
            var open = !panel.classList.contains("open");
            panel.classList.toggle("open", open);
            wrap.classList.toggle("is-open", open);
            btn.setAttribute("aria-expanded", open ? "true" : "false");
            if (label) label.textContent = open ? "收起" : "了解我的更多";
        });
    }

    /* ---------------- 2. 背景浮尘 ---------------- */

    function buildDust() {
        var box = doc.getElementById("dust");
        if (!box || reduced) return;
        var n = window.innerWidth < 760 ? 10 : 18;
        for (var i = 0; i < n; i++) {
            var d = doc.createElement("span");
            d.className = "dust";
            var dur = 14 + Math.random() * 18;
            d.style.left = (Math.random() * 100).toFixed(2) + "%";
            d.style.top = (55 + Math.random() * 50).toFixed(2) + "%";
            d.style.opacity = (0.2 + Math.random() * 0.55).toFixed(2);
            d.style.width = d.style.height = (1 + Math.random() * 2).toFixed(1) + "px";
            d.style.animationDuration = dur.toFixed(1) + "s";
            d.style.animationDelay = (-Math.random() * dur).toFixed(1) + "s";
            box.appendChild(d);
        }
    }

    /* ---------------- 3. 开场 ---------------- */

    var boot = doc.getElementById("boot");
    var enterBtn = doc.getElementById("enter");
    var skipBtn = doc.getElementById("skip");
    var params = new URLSearchParams(window.location.search);
    var forceBoot = params.get("boot") === "1";
    var forceEnter = params.get("enter") === "1";
    var visited = false;

    try {
        visited = sessionStorage.getItem("lqmy_entered") === "1";
    } catch (e) {}

    function finishEnter(instant) {
        if (body.classList.contains("entered")) return;
        body.classList.remove("booting");
        body.classList.add("entered");

        try {
            sessionStorage.setItem("lqmy_entered", "1");
        } catch (e) {}

        if (boot) {
            if (instant) {
                boot.style.display = "none";
            } else {
                setTimeout(function () {
                    boot.style.display = "none";
                }, 1200);
            }
        }
        window.scrollTo(0, 0);
    }

    function runBoot() {
        var lines = doc.querySelectorAll("[data-boot-line]");
        var bar = doc.getElementById("bootBar");
        var t = 320;

        for (var i = 0; i < lines.length; i++) {
            (function (line, idx) {
                setTimeout(function () {
                    line.classList.add("on");
                }, t + idx * 560);
            })(lines[i], i);
        }

        setTimeout(function () {
            if (bar) bar.classList.add("on");
        }, t + 300);

        setTimeout(function () {
            if (enterBtn) enterBtn.classList.add("on");
        }, t + lines.length * 560 + 200);

        /* 万一按钮没弹出来，也别把人卡在开场里 */
        setTimeout(function () {
            if (!body.classList.contains("entered")) finishEnter(false);
        }, 15000);
    }

    if (enterBtn) {
        enterBtn.addEventListener("click", function () {
            enterBtn.classList.add("leaving");
            setTimeout(function () {
                finishEnter(false);
            }, 240);
        });
    }

    if (skipBtn) {
        skipBtn.addEventListener("click", function () {
            finishEnter(true);
        });
    }

    doc.addEventListener("keydown", function (e) {
        if (body.classList.contains("entered")) return;
        if (e.key === "Enter" || e.key === " " || e.key === "Escape") {
            e.preventDefault();
            finishEnter(true);
        }
    });

    /* ---------------- 4. 滚动出现 ---------------- */

    function setupReveal() {
        var els = [];
        var nodes = doc.querySelectorAll(".reveal");
        for (var i = 0; i < nodes.length; i++) els.push(nodes[i]);

        if (!("IntersectionObserver" in window) || reduced) {
            for (var j = 0; j < els.length; j++) els[j].classList.add("in");
            return;
        }

        var io = new IntersectionObserver(
            function (entries) {
                for (var k = 0; k < entries.length; k++) {
                    if (entries[k].isIntersecting) {
                        entries[k].target.classList.add("in");
                        io.unobserve(entries[k].target);
                    }
                }
            },
            { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
        );

        for (var m = 0; m < els.length; m++) io.observe(els[m]);
    }

    /* ---------------- 5. 顶栏和锚点 ---------------- */

    function setupSpy() {
        var topbar = doc.getElementById("topbar");
        if (topbar) {
            var onScroll = function () {
                topbar.classList.toggle("solid", window.scrollY > 40);
            };
            window.addEventListener("scroll", onScroll, { passive: true });
            onScroll();
        }

        if (!("IntersectionObserver" in window)) return;

        var links = doc.querySelectorAll("[data-spy]");
        if (!links.length) return;

        var targets = [];
        for (var i = 0; i < links.length; i++) {
            var sec = doc.querySelector(links[i].getAttribute("href"));
            if (sec) targets.push(sec);
        }

        var spy = new IntersectionObserver(
            function (entries) {
                for (var k = 0; k < entries.length; k++) {
                    if (!entries[k].isIntersecting) continue;
                    var id = "#" + entries[k].target.id;
                    for (var n = 0; n < links.length; n++) {
                        links[n].classList.toggle("active", links[n].getAttribute("href") === id);
                    }
                }
            },
            { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
        );

        for (var t = 0; t < targets.length; t++) spy.observe(targets[t]);
    }

    /* ---------------- 6. 鼠标一点视差 ---------------- */

    function setupParallax() {
        if (reduced || window.innerWidth <= 820) return;

        var supported = false;
        try {
            supported = window.CSS && CSS.supports && CSS.supports("translate", "1px 1px");
        } catch (e) {}

        if (!supported) return;

        var hero = doc.querySelector(".hero");
        if (!hero) return;

        var blobs = [];
        var nodes = doc.querySelectorAll(".aurora");
        for (var i = 0; i < nodes.length; i++) blobs.push(nodes[i]);

        var ticking = false;
        hero.addEventListener("pointermove", function (e) {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(function () {
                ticking = false;
                var x = e.clientX / window.innerWidth - 0.5;
                var y = e.clientY / window.innerHeight - 0.5;
                for (var k = 0; k < blobs.length; k++) {
                    var d = (k + 1) * 14;
                    blobs[k].style.translate = (x * d).toFixed(1) + "px " + (y * d).toFixed(1) + "px";
                }
            });
        });
    }

    /* ---------------- 7. 点链接先落幕布 ---------------- */

    var wipe = doc.getElementById("wipe");

    doc.addEventListener("click", function (e) {
        var a = e.target && e.target.closest ? e.target.closest("a[data-nav]") : null;
        if (!a) return;
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

        var href = a.getAttribute("href");
        if (!href || href.charAt(0) === "#") return;

        e.preventDefault();

        if (reduced || !wipe) {
            window.location.href = href;
            return;
        }

        wipe.classList.add("in");
        try {
            sessionStorage.setItem("lqmy_nav", "1");
        } catch (err) {}

        setTimeout(function () {
            window.location.href = href;
        }, 600);
    });

    window.addEventListener("pageshow", function (ev) {
        if (ev.persisted && wipe) wipe.classList.remove("in");
    });

    /* ---------------- 开始 ---------------- */

    fillText();
    buildChips();
    buildInfo();
    buildBootLines();
    buildMore();
    buildGallery();
    buildDust();
    setupReveal();
    setupSpy();
    setupParallax();
    setupMore();

    var arrived = window.__LQMY_ARRIVED === true;

    if ((visited && !forceBoot) || forceEnter || reduced || arrived) {
        finishEnter(true);
    } else {
        runBoot();
    }
})();
