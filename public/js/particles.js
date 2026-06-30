// Lightweight particle system — no deps, pure canvas
export function initParticles(canvas) {
  const ctx = canvas.getContext("2d");
  let w, h, anim;

  const pts = [];
  const COUNT = 70;

  function resize() {
    const p = canvas.parentElement;
    w = canvas.width = p.offsetWidth;
    h = canvas.height = p.offsetHeight;
  }
  resize();
  window.addEventListener("resize", resize);

  for (let i = 0; i < COUNT; i++) {
    pts.push({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.8 + 0.4,
      dx: (Math.random() - 0.5) * 0.25,
      dy: -Math.random() * 0.25 - 0.05,
      o: Math.random() * 0.35 + 0.08,
    });
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    for (const p of pts) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(124,108,240,${p.o})`;
      ctx.fill();
      p.x += p.dx;
      p.y += p.dy;
      if (p.y < -10) p.y = h + 10;
      if (p.x < -10) p.x = w + 10;
      if (p.x > w + 10) p.x = -10;
    }
    anim = requestAnimationFrame(draw);
  }
  draw();

  return () => {
    cancelAnimationFrame(anim);
    window.removeEventListener("resize", resize);
  };
}
