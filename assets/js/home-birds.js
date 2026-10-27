/* 个人主页：天上飞过去的鸟（画布版，跟滚动无关，一直在飞） */
(function () {
    var cv = document.getElementById("homeBirds");
    if (!cv || !cv.getContext) return;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    var ctx = cv.getContext("2d");
    var W = 0, H = 0, dpr = 1, birds = [], raf = 0, last = 0;

    function make(init) {
        var group = Math.random() < 0.35 ? "far" : "near";
        var s = group === "far" ? 4 + Math.random() * 4 : 8 + Math.random() * 10;
        var dir = Math.random() < 0.72 ? 1 : -1;   /* 多数从左上往右下飞 */
        return {
            g: group,
            s: s,
            dir: dir,
            x: init ? Math.random() * W : (dir > 0 ? -60 - Math.random() * 200 : W + 60 + Math.random() * 200),
            y: H * (0.06 + Math.random() * 0.42),
            vx: (group === "far" ? 26 : 48) + Math.random() * 26,
            vy: (Math.random() - 0.5) * 8,
            flap: Math.random() * Math.PI * 2,
            flapSp: 5 + Math.random() * 3,
            a: group === "far" ? 0.16 + Math.random() * 0.1 : 0.34 + Math.random() * 0.18
        };
    }

    function resize() {
        dpr = Math.min(2, window.devicePixelRatio || 1);
        W = cv.clientWidth || window.innerWidth;
        H = cv.clientHeight || window.innerHeight;
        cv.width = Math.round(W * dpr);
        cv.height = Math.round(H * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        var n = W < 720 ? 5 : 9;
        while (birds.length < n) birds.push(make(true));
        birds.length = n;
    }

    function draw(b) {
        var lift = Math.sin(b.flap) * b.s * 0.85;
        var w = b.s;
        ctx.beginPath();
        ctx.moveTo(b.x - w * b.dir, b.y + Math.abs(lift) * 0.22);
        ctx.quadraticCurveTo(b.x - w * 0.42 * b.dir, b.y - lift, b.x, b.y);
        ctx.quadraticCurveTo(b.x + w * 0.42 * b.dir, b.y - lift, b.x + w * b.dir, b.y + Math.abs(lift) * 0.22);
        ctx.lineWidth = Math.max(1.1, b.s * (b.g === "far" ? 0.13 : 0.16));
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = "rgba(8, 14, 26," + b.a + ")";
        ctx.stroke();
    }

    function tick(t) {
        var dt = last ? Math.min(0.05, (t - last) / 1000) : 0.016;
        last = t;
        ctx.clearRect(0, 0, W, H);
        for (var i = 0; i < birds.length; i++) {
            var b = birds[i];
            b.flap += dt * b.flapSp;
            b.x += b.vx * b.dir * dt;
            b.y += b.vy * dt + Math.sin(t / 2400 + i) * 0.12;
            if ((b.dir > 0 && b.x > W + 80) || (b.dir < 0 && b.x < -80)) {
                birds[i] = make(false);
                continue;
            }
            draw(b);
        }
        raf = requestAnimationFrame(tick);
    }

    function start() { if (!raf) { last = 0; raf = requestAnimationFrame(tick); } }
    function stop() { if (raf) { cancelAnimationFrame(raf); raf = 0; } }

    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", function () { if (document.hidden) stop(); else start(); });

    resize();
    start();
})();
