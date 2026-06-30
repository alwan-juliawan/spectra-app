import { auth, showAuth } from "../auth.js";

const ICONS = {
  tagihan: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>`,
  gerbang: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`,
  pulih: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
};

export function renderHome() {
  const app = document.getElementById("app");
  app.innerHTML = `
<div class="hero-spectra reveal">
  <h1>Spectra</h1>
  <p>Tiga alat gratis untuk produktivitas dan kreasi kamu. Tanpa biaya, tanpa batas.</p>
  ${auth.user ? `<p class="muted">Halo, ${auth.user.name}!</p>` : `<button class="btn btn-primary" id="home-login">Mulai Gratis</button>`}
</div>
<div class="tool-grid container" id="tool-grid">
  <div class="tool-card card-hover" data-tool="invoice">
    <div class="tool-icon tool-icon--purple">${ICONS.tagihan}</div>
    <h3>Tagihan</h3>
    <p>Buat invoice profesional, export PDF, track status pembayaran. Gratis.</p>
    <span class="btn btn-ghost btn-sm">Buka →</span>
  </div>
  <div class="tool-card card-hover" data-tool="page">
    <div class="tool-icon tool-icon--green">${ICONS.gerbang}</div>
    <h3>Gerbang</h3>
    <p>Link-in-bio gratis. Custom theme, unlimited links, visitor counter.</p>
    <span class="btn btn-ghost btn-sm">Buka →</span>
  </div>
  <div class="tool-card card-hover" data-tool="habit">
    <div class="tool-icon tool-icon--amber">${ICONS.pulih}</div>
    <h3>Pulih</h3>
    <p>Habit tracker harian. Streak, chart, dan progress visual.</p>
    <span class="btn btn-ghost btn-sm">Buka →</span>
  </div>
</div>
<footer class="footer-app">Spectra — gratis untuk semua orang</footer>`;

  document.getElementById("home-login")?.addEventListener("click", showAuth);
  document.querySelectorAll("[data-tool]").forEach((el) => {
    el.addEventListener("click", () => {
      const page = el.dataset.tool;
      if (auth.user) window.__nav(`/${page}`);
      else showAuth();
    });
  });
}
