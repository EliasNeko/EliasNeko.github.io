/* 书房背景：落书（知识库所有页面共用）
   自己建画布，页面只要引这一个文件 */
(function () {
    if (document.getElementById("kbBooks")) return;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    var cv = document.createElement("canvas");
    cv.id = "kbBooks";
    cv.className = "kb-books";
    cv.setAttribute("aria-hidden", "true");
    (document.body || document.documentElement).insertBefore(cv, document.body ? document.body.firstChild : null);

    var ctx = cv.getContext("2d");
    if (!ctx) return;
    var W = 0, H = 0, dpr = 1, books = [], raf = 0, last = 0;

    function spawn(init) {
        var s = 0.55 + Math.random() * 0.95;
        return {
            x: Math.random() * W,
            y: init ? Math.random() * H : -50 * s,
            s: s,
            vy: (14 + Math.random() * 26) * s,
            rot: (Math.random() - 0.5) * 1.2,
            vr: (Math.random() - 0.5) * 0.55,
            sw: Math.random() * Math.PI * 2,
            sa: 0.35 + Math.random() * 0.8,
            a: 0.10 + Math.random() * 0.12
        };
    }

    function resize() {
        dpr = Math.min(2, window.devicePixelRatio || 1);
        W = window.innerWidth;
        H = window.innerHeight;
        cv.width = Math.round(W * dpr);
        cv.height = Math.round(H * dpr);
        cv.style.width = W + "px";
        cv.style.height = H + "px";
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        var n = Math.max(5, Math.min(13, Math.round(W / 135)));
        while (books.length < n) books.push(spawn(true));
        books.length = n;
    }

    function roundRect(x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    }

    function draw(b) {
        var w = 17, h = 23;
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.rot);
        ctx.scale(b.s, b.s);

        ctx.fillStyle = "rgba(232, 220, 196," + b.a + ")";
        roundRect(-w / 2, -h / 2, w, h, 2);
        ctx.fill();

        ctx.strokeStyle = "rgba(226, 199, 156," + (b.a * 0.9) + ")";
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.strokeStyle = "rgba(10, 12, 17, 0.45)";
        ctx.beginPath();
        ctx.moveTo(-w / 2 + 4, -h / 2 + 2);
        ctx.lineTo(-w / 2 + 4, h / 2 - 2);
        ctx.stroke();

        ctx.strokeStyle = "rgba(255, 255, 255, 0.10)";
        for (var i = 0; i < 3; i++) {
            var yy = -h / 2 + 7 + i * 5;
            ctx.beginPath();
            ctx.moveTo(-w / 2 + 7, yy);
            ctx.lineTo(w / 2 - 3, yy);
            ctx.stroke();
        }
        ctx.restore();
    }

    function tick(t) {
        var dt = last ? Math.min(0.05, (t - last) / 1000) : 0.016;
        last = t;
        ctx.clearRect(0, 0, W, H);
        for (var i = 0; i < books.length; i++) {
            var b = books[i];
            b.sw += dt;
            b.y += b.vy * dt;
            b.x += Math.sin(b.sw) * b.sa * 0.35;
            b.rot += b.vr * dt;
            if (b.y > H + 70) {
                books[i] = spawn(false);
                books[i].x = Math.random() * W;
                continue;
            }
            draw(b);
        }
        raf = requestAnimationFrame(tick);
    }

    function start() { if (!raf) { last = 0; raf = requestAnimationFrame(tick); } }
    function stop() { if (raf) { cancelAnimationFrame(raf); raf = 0; } }

    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", function () {
        if (document.hidden) stop(); else start();
    });

    resize();
    start();
})();
