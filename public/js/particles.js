// Full-viewport cursor-following particle system
export function initParticles() {
  const canvas = document.createElement("canvas");
  canvas.id = "particle-canvas";
  Object.assign(canvas.style, {
    position: "fixed",
    inset: "0",
    width: "100vw",
    height: "100vh",
    pointerEvents: "none",
    zIndex: "0",
  });
  document.body.prepend(canvas);

  const ctx = canvas.getContext("2d");
  let w, h, anim, mx = null, my = null;

  const pts = [];
  const COUNT = 120;

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener("resize", resize);

  const rect = () => canvas.getBoundingClientRect();
  window.addEventListener("mousemove", (e) => {
    const r = rect();
    mx = e.clientX - r.left;
    my = e.clientY - r.top;
  });
  window.addEventListener("mouseleave", () => { mx = my = null; });

  for (let i = 0; i < COUNT; i++) {
    pts.push({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 2.4 + 0.3,
      dx: (Math.random() - 0.5) * 0.2,
      dy: -Math.random() * 0.25 - 0.03,
      o: Math.random() * 0.35 + 0.05,
      hue: 250 + Math.random() * 50, // 250-300 — purple to pink
    });
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    for (const p of pts) {
      if (mx !== null && my !== null) {
        const dx = mx - p.x, dy = my - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 1 && dist < 350) {
          const force = 0.8 / (dist * 0.015 + 1);
          p.dx += (dx / dist) * force * 0.06;
          p.dy += (dy / dist) * force * 0.06;
        }
      }

      p.dx *= 0.97;
      p.dy *= 0.97;
      p.dy -= 0.003;

      p.x += p.dx;
      p.y += p.dy;

      if (p.y < -20) { p.y = h + 20; p.x = Math.random() * w; }
      if (p.x < -20) p.x = w + 20;
      if (p.x > w + 20) p.x = -20;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue}, 65%, 60%, ${p.o})`;
      ctx.fill();

      if (p.r > 1.4) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 2.2, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 55%, 65%, ${p.o * 0.2})`;
        ctx.fill();
      }
    }
    anim = requestAnimationFrame(draw);
  }
  draw();

  return () => {
    cancelAnimationFrame(anim);
    canvas.remove();
    window.removeEventListener("resize", resize);
  };
}
