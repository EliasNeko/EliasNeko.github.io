/* 咖啡店头图上的雨。
   只在头图那一屏画；滚出屏幕、或者切到别的标签页就停，不让它一直吃 CPU。 */
(function () {
    "use strict";

    var canvas = document.getElementById("rain");
    if (!canvas) return;

    var ctx = canvas.getContext && canvas.getContext("2d");
    if (!ctx) return;

    var reduce = false;
    try {
        reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch (e) {}

    if (reduce) {
        canvas.style.display = "none";
        return;
    }

    var hero = canvas.parentNode;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0;
    var h = 0;
    var drops = [];
    var raf = 0;
    var last = 0;
    var visible = true;
    var resizeTimer = 0;

    function makeDrops() {
        var count = Math.max(36, Math.min(150, Math.round((w * h) / 14000)));
        drops = [];
        for (var i = 0; i < count; i++) {
            drops.push({
                x: Math.random() * w,
                y: Math.random() * h,
                len: 10 + Math.random() * 26,
                speed: 320 + Math.random() * 520,
                slant: 0.14 + Math.random() * 0.12,
                alpha: 0.06 + Math.random() * 0.2,
                wide: Math.random() < 0.7 ? 1 : 1.6,
                near: Math.random() < 0.16
            });
        }
    }

    function resize() {
        var rect = hero.getBoundingClientRect();
        w = Math.max(1, Math.round(rect.width));
        h = Math.max(1, Math.round(rect.height));
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        canvas.style.width = w + "px";
        canvas.style.height = h + "px";
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        makeDrops();
    }

    function step(ts) {
        raf = 0;
        if (!visible) return;
        if (!last) last = ts;
        var dt = Math.min(0.05, (ts - last) / 1000);
        last = ts;

        ctx.clearRect(0, 0, w, h);
        ctx.lineCap = "round";

        for (var i = 0; i < drops.length; i++) {
            var d = drops[i];
            d.y += d.speed * dt;
            d.x -= d.speed * dt * d.slant * 0.35;
            if (d.y > h + 40) {
                d.y = -d.len - Math.random() * 140;
                d.x = Math.random() * (w + 60) - 30;
            }
            if (d.x < -24) d.x += w + 48;

            var a = d.alpha * (d.near ? 1.7 : 1);
            ctx.strokeStyle = "rgba(196, 222, 255, " + a.toFixed(3) + ")";
            ctx.lineWidth = d.near ? d.wide * 1.6 : d.wide;
            ctx.beginPath();
            ctx.moveTo(d.x, d.y);
            ctx.lineTo(d.x - d.len * d.slant, d.y + d.len);
            ctx.stroke();
        }

        raf = requestAnimationFrame(step);
    }

    function start() {
        if (raf || !visible) return;
        last = 0;
        raf = requestAnimationFrame(step);
    }

    function stop() {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
    }

    if ("IntersectionObserver" in window) {
        new IntersectionObserver(
            function (entries) {
                visible = entries[0].isIntersecting;
                if (visible) start();
                else stop();
            },
            { threshold: 0.01 }
        ).observe(hero);
    }

    document.addEventListener("visibilitychange", function () {
        if (document.hidden) stop();
        else if (visible) start();
    });

    window.addEventListener("resize", function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(resize, 160);
    });

    resize();
    start();
})();
