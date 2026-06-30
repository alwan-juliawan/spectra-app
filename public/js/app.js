import { initAuth, auth, showAuth, logoutUser, onAuthChange } from "./auth.js";
import { renderHome } from "./pages/home.js";
import { renderInvoice } from "./pages/invoice.js";
import { renderPage } from "./pages/page.js";
import { renderHabit } from "./pages/habit.js";
import { renderPublicBio } from "./pages/public.js";

const APP = document.getElementById("app");
const ROOT = document.getElementById("root");

// ===== Theme =====
function initTheme() {
  const stored = localStorage.getItem("spectra-theme");
  if (stored === "light") document.documentElement.classList.add("light");
}

function toggleTheme() {
  document.documentElement.classList.toggle("light");
  localStorage.setItem("spectra-theme", document.documentElement.classList.contains("light") ? "light" : "dark");
}

// ===== Nav =====
function renderNav(loggedIn) {
  const nav = document.getElementById("nav");
  if (!nav) return;
  nav.innerHTML = `<div class="nav-inner">
    <a href="/" class="nav-logo" data-nav><span class="nav-logo-dot"></span>SPECTRA</a>
    <div class="nav-actions">
      ${loggedIn ? `<span class="nav-user">${esc(auth.user?.name || "")}</span>
        <button class="btn btn-icon" id="nav-invoice" data-nav title="Tagihan"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg></button>
        <button class="btn btn-icon" id="nav-page" data-nav title="Gerbang"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg></button>
        <button class="btn btn-icon" id="nav-habit" data-nav title="Pulih"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></button>
        <button class="btn btn-ghost btn-sm" id="nav-logout">Keluar</button>` :
        `<button class="btn btn-primary btn-sm" id="nav-login">Masuk</button>`}
      <button class="btn btn-icon" id="theme-toggle" title="Ganti tema"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/></svg></button>
    </div>
  </div>`;

  document.getElementById("theme-toggle")?.addEventListener("click", toggleTheme);
  document.getElementById("nav-login")?.addEventListener("click", showAuth);
  document.getElementById("nav-logout")?.addEventListener("click", logoutUser);
  nav.querySelectorAll("[data-nav]").forEach((el) => el.addEventListener("click", (e) => {
    e.preventDefault();
    const path = el.getAttribute("href") || el.id.replace("nav-", "/") || "/";
    navigate(path);
  }));
}

// ===== Router =====
const routes = {
  "/": renderHome,
  "/invoice": renderInvoice,
  "/page": renderPage,
  "/habit": renderHabit,
};

const RESERVED = new Set(["/", "/invoice", "/page", "/habit"]);

function navigate(path) {
  history.pushState(null, "", path);

  // SPA routes first
  const renderer = routes[path];
  if (renderer) {
    APP.classList.remove("hidden");
    ROOT.classList.add("hidden");
    renderer();
    return;
  }

  // Public bio
  const match = path.match(/^\/([a-z0-9-]{3,30})$/);
  if (match && !RESERVED.has(path)) {
    APP.classList.add("hidden");
    ROOT.classList.remove("hidden");
    renderPublicBio(match[1]);
    return;
  }

  // fallback to home
  navigate("/");
}

// ===== Boot =====
async function boot() {
  initTheme();
  await initAuth();

  // Handle nav clicks
  onAuthChange((loggedIn) => {
    renderNav(loggedIn);
  });

  // Initial nav render
  renderNav(!!auth.user);

  // Handle browser back/forward
  window.addEventListener("popstate", () => navigate(location.pathname));

  // Direct navigation
  window.__nav = navigate;
  window.__router = { rerender: () => navigate(location.pathname) };

  // Route initial path
  navigate(location.pathname);
}

document.addEventListener("DOMContentLoaded", boot);
