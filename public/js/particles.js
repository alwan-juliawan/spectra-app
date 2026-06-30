// Cursor-following particle system — inspired by antigravity.google
export function initParticles(canvas) {
  const ctx = canvas.getContext("2d");
  let w, h, anim, mx = null, my = null;

  const pts = [];
  const COUNT = 80;

  function resize() {
    const p = canvas.parentElement;
    w = canvas.width = p.offsetWidth;
    h = canvas.height = p.offsetHeight;
  }
  resize();
  window.addEventListener("resize", resize);

  canvas.addEventListener("mousemove", (e) => {
    mx = e.clientX - canvas.getBoundingClientRect().left;
    my = e.clientY - canvas.getBoundingClientRect().top;
  });
  canvas.addEventListener("mouseleave", () => { mx = my = null; });

  for (let i = 0; i < COUNT; i++) {
    pts.push({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 2.2 + 0.3,
      dx: (Math.random() - 0.5) * 0.15,
      dy: -Math.random() * 0.2 - 0.03,
      o: Math.random() * 0.4 + 0.06,
      // warm palette: purple→pink→amber
      hue: 260 + Math.random() * 40, // 260-300 (purple-magenta range, warmer = more pink)
    });
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    for (const p of pts) {
      // mouse attraction
      if (mx !== null && my !== null) {
        const dx = mx - p.x, dy = my - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 1 && dist < 300) {
          const force = 0.6 / (dist * 0.02 + 1); // gentle pull
          p.dx += (dx / dist) * force * 0.04;
          p.dy += (dy / dist) * force * 0.04;
        }
      }

      // dampen velocity
      p.dx *= 0.98;
      p.dy *= 0.98;

      // base drift upward
      p.dy -= 0.002;

      p.x += p.dx;
      p.y += p.dy;

      // wrap around
      if (p.y < -20) { p.y = h + 20; p.x = Math.random() * w; }
      if (p.x < -20) p.x = w + 20;
      if (p.x > w + 20) p.x = -20;

      // draw with warm glow
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue}, 70%, 65%, ${p.o})`;
      ctx.fill();

      // subtle glow ring
      if (p.r > 1.2) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 2, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 60%, 70%, ${p.o * 0.25})`;
        ctx.fill();
      }
    }
    anim = requestAnimationFrame(draw);
  }
  draw();

  return () => {
    cancelAnimationFrame(anim);
    window.removeEventListener("resize", resize);
  };
}
