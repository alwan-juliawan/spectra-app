import { auth, showAuth } from "../auth.js";
import { initParticles } from "../particles.js";

const TYPE_WORDS = ["produktivitas", "kreativitas", "bisnis kamu", "rutinitas"];

function startTyping(el) {
  let wi = 0, ci = 0, deleting = false;
  function tick() {
    const word = TYPE_WORDS[wi];
    if (!deleting) {
      el.textContent = word.slice(0, ++ci);
      if (ci === word.length) { deleting = true; return setTimeout(tick, 1600); }
    } else {
      el.textContent = word.slice(0, --ci);
      if (ci === 0) { deleting = false; wi = (wi + 1) % TYPE_WORDS.length; }
    }
    setTimeout(tick, deleting ? 45 : 90);
  }
  tick();
}

function initReveal() {
  const els = document.querySelectorAll(".reveal-up");
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    }
  }, { threshold: 0.15 });
  els.forEach((el) => io.observe(el));
}

const ICONS = {
  tagihan: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>`,
  gerbang: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`,
  pulih: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>`,
};

function mockInvoice() {
  return `<div class="mocku">
    <div class="mocku-inv-row"><span style="color:var(--accent);font-weight:700;font-size:13px">Design LP</span><span style="font-size:11px;color:var(--fg-muted);flex:1">PT Maju</span><span class="mocku-badge mocku-badge-g">Lunas</span><span style="font-weight:700;font-size:13px">Rp2,5jt</span></div>
    <div class="mocku-inv-row"><span style="color:var(--fg);font-weight:700;font-size:13px">Brand Identity</span><span style="font-size:11px;color:var(--fg-muted);flex:1">Startup XYZ</span><span class="mocku-badge mocku-badge-a">Tertunda</span><span style="font-weight:700;font-size:13px">Rp5jt</span></div>
    <div class="mocku-inv-row"><span style="color:var(--fg);font-weight:700;font-size:13px">Mobile App</span><span style="font-size:11px;color:var(--fg-muted);flex:1">TechCorp</span><span class="mocku-badge mocku-badge-r">Jatuh Tempo</span><span style="font-weight:700;font-size:13px">Rp8jt</span></div>
    <div class="mocku-inv-footer">📄 Export PDF · 11 invoice bulan ini</div>
  </div>`;
}

function mockBio() {
  return `<div class="mocku mocku-bio">
    <div class="mocku-av">B</div>
    <div class="mocku-bio-name">@budi.design</div>
    <div class="mocku-bio-desc">UI/UX Designer · Mentor</div>
    <div class="mocku-bio-links"><span>👜 Portfolio ↗</span><span>🏀 Dribbble ↗</span><span>💬 WhatsApp ↗</span></div>
    <div class="mocku-bio-foot">📍 Jakarta · 1.230 kunjungan</div>
  </div>`;
}

function mockHabit() {
  const d = (a, b) => {
    const cells = [];
    for (let i = 0; i < 7; i++) cells.push(`<span class="mocku-h-circle ${i < a ? (i < b ? "mc-done" : "mc-miss") : ""}">${i < b ? "✓" : ""}</span>`);
    return cells.join("");
  };
  return `<div class="mocku">
    <div class="mocku-h-head"><span>Rutinitas Harian</span><span class="mocku-streak">🔥 7 hari</span></div>
    <div class="mocku-h-row"><span class="mocku-h-label">Minum Air</span><div class="mocku-h-dots">${d(7, 3)}</div></div>
    <div class="mocku-h-row"><span class="mocku-h-label">Olahraga</span><div class="mocku-h-dots">${d(7, 4)}</div></div>
    <div class="mocku-h-row"><span class="mocku-h-label">Baca Buku</span><div class="mocku-h-dots">${d(7, 1)}</div></div>
    <div class="mocku-h-foot"><span>87</span><span>7</span><span>12/21</span></div>
  </div>`;
}

function toolSection(title, color, mockFn, features, reversed, desc) {
  const cls = reversed ? "feat-section feat-reverse" : "feat-section";
  const fc = `var(--${color})`;
  return `<div class="${cls}"><div class="feat-visual"><div class="feat-visual-inner" style="--fc:${fc}">${mockFn()}</div></div><div class="feat-text"><span class="feat-badge" style="background:var(--${color}-soft);color:${fc}">${title}</span><h2>${title === "Tagihan" ? "Invoice profesional. Gratis." : title === "Gerbang" ? "Satu link untuk semua link." : "Bangun rutinitas. Raih streak."}</h2><p class="feat-desc">${desc}</p><ul class="feat-list">${features.map(f => `<li><span class="feat-check" style="color:${fc}">${ICONS.check}</span> ${f}</li>`).join("")}</ul></div></div>`;
}

export function renderHome() {
  const app = document.getElementById("app");
  app.innerHTML = `
<section class="hero">
  <canvas class="hero-canvas" id="hero-canvas"></canvas>
  <div class="hero-inner">
    <div class="hero-badge">🚀 Gratis selamanya · Tanpa kartu</div>
    <h1>Spektrum <span class="hero-type" id="hero-type"></span><span class="hero-cursor"></span></h1>
    <p>Invoice auto, link-in-bio, habit tracker —<br/>tiga alat gratis, satu platform.</p>
    ${auth.user ? `<p class="hero-greeting">👋 Halo, ${auth.user.name}!</p>` : `<button class="btn btn-primary btn-lg" id="home-login">Mulai Gratis →</button>`}
  </div>
</section>
<div class="tool-grid container reveal-up">
  <div class="tool-card card-hover" data-tool="invoice"><div class="tool-icon tool-icon--purple">${ICONS.tagihan}</div><h3>Tagihan</h3><p>Invoice + PDF + tracking status.</p><span class="btn btn-ghost btn-sm">Buka →</span></div>
  <div class="tool-card card-hover" data-tool="page"><div class="tool-icon tool-icon--green">${ICONS.gerbang}</div><h3>Gerbang</h3><p>Link-in-bio, unlimited links, tema.</p><span class="btn btn-ghost btn-sm">Buka →</span></div>
  <div class="tool-card card-hover" data-tool="habit"><div class="tool-icon tool-icon--amber">${ICONS.pulih}</div><h3>Pulih</h3><p>Habit tracker + streak + statistik.</p><span class="btn btn-ghost btn-sm">Buka →</span></div>
</div>
<div class="feat-container container">
  <div class="feat-head reveal-up"><h2>Lihat cara kerjanya</h2><p>Simpel, langsung pakai. Tanpa tutorial bertele-tele.</p></div>
  <div class="reveal-up">${toolSection("Tagihan","accent",mockInvoice,["Export PDF — siap kirim ke klien","Status: lunas, tertunda, jatuh tempo","Multi-mata uang (IDR, USD, SGD)","Auto-numbering invoice"],0,"Freelancer, UMKM, agensi — buat invoice profesional tanpa ribet. Lacak status, export PDF, semua gratis.")}</div>
  <div class="reveal-up">${toolSection("Gerbang","green",mockBio,["Custom slug bebas","Link tak terbatas, atur ulang kapan aja","Beberapa tema warna","Visitor counter real-time"],1,"Kumpulin semua link penting di satu halaman. Pasang di bio IG, TikTok, WA. Pantau pengunjung, ganti tema semaumu.")}</div>
  <div class="reveal-up">${toolSection("Pulih","amber",mockHabit,["Check-in harian 1 ketuk","Streak counter bikin makin semangat","Statistik pekanan + total","Ikon & warna tiap kebiasaan"],0,"Bangun rutinitas konsisten. Catat habit harian, lihat streak, ukur progress dari pekan ke pekan.")}</div>
</div>
<div class="cta-section reveal-up"><div class="container center">
  <h2>Siap naikkan level produktivitas?</h2>
  <p>Gratis selamanya. Tanpa daftar kartu. Langsung pakai.</p>
  ${auth.user ? '<button class="btn btn-primary btn-lg" onclick="window.__nav(\'/invoice\')">Mulai Pakai →</button>' : '<button class="btn btn-primary btn-lg" id="home-login">Buat Akun Gratis →</button>'}
</div></div>
<footer class="footer-app">Spectra — gratisan, bukan murahan. ❤️ Indonesia</footer>`;

  document.getElementById("home-login")?.addEventListener("click", showAuth);
  document.querySelectorAll("[data-tool]").forEach(el => {
    el.addEventListener("click", () => {
      if (auth.user) window.__nav(`/${el.dataset.tool}`);
      else showAuth();
    });
  });

  const canvas = document.getElementById("hero-canvas");
  if (canvas) initParticles(canvas);
  const typeEl = document.getElementById("hero-type");
  if (typeEl) startTyping(typeEl);
  initReveal();
}
