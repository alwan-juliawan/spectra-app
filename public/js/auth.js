import { api } from "./api.js";

export const auth = { user: null, token: null };

// Notify subscribers when auth state changes
const listeners = [];
export function onAuthChange(fn) {
  listeners.push(fn);
}

function notify() {
  const loggedIn = !!auth.user;
  listeners.forEach((fn) => fn(loggedIn));
}

// ===== INIT =====
export async function initAuth() {
  const token = localStorage.getItem("token");
  if (!token) return;
  auth.token = token;
  try {
    const { user } = await api.me();
    auth.user = user;
    notify();
  } catch {
    localStorage.removeItem("token");
    auth.token = null;
  }
}

// ===== LOGIN MODAL =====
export function showAuth() {
  const existing = document.getElementById("auth-modal");
  if (existing) existing.remove();
  const m = document.createElement("div");
  m.id = "auth-modal";
  m.innerHTML = `
<div class="auth-overlay" onclick="this.closest('#auth-modal').remove()">
<div class="auth-modal" onclick="event.stopPropagation()">
<button class="auth-close" onclick="this.closest('#auth-modal').remove()">&#10005;</button>
<div class="auth-tabs"><button class="auth-tab active" data-tab="login" onclick="window.__showAuthTab('login')">Masuk</button><button class="auth-tab" data-tab="register" onclick="window.__showAuthTab('register')">Daftar</button></div>
<form id="auth-form" class="auth-form" novalidate>
<div class="field" id="auth-name-field"><label>Nama</label><input id="auth-name" type="text" placeholder="Nama kamu" /></div>
<div class="field"><label>Email</label><input id="auth-email" type="email" placeholder="email@contoh.com" required /></div>
<div class="field"><label>Password</label><input id="auth-pass" type="password" placeholder="Min 6 karakter" required /></div>
<button class="btn btn-primary btn-block" type="submit" id="auth-submit">Masuk</button>
<p class="auth-error" id="auth-error"></p>
</form>
</div></div>`;
  document.body.appendChild(m);
  window.__showAuthTab = (tab) => {
    document.querySelectorAll(".auth-tab").forEach((t) => t.classList.toggle("active", t.dataset.tab === tab));
    document.getElementById("auth-name-field").style.display = tab === "register" ? "block" : "none";
    document.getElementById("auth-submit").textContent = tab === "register" ? "Buat Akun" : "Masuk";
  };
  document.getElementById("auth-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const isReg = document.querySelector(".auth-tab.active").dataset.tab === "register";
    const email = document.getElementById("auth-email").value.trim();
    const password = document.getElementById("auth-pass").value;
    const name = document.getElementById("auth-name")?.value?.trim() || "";
    const btn = document.getElementById("auth-submit");
    const err = document.getElementById("auth-error");
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span>';
    err.textContent = "";
    try {
      const data = isReg ? await api.register({ email, name, password }) : await api.login({ email, password });
      localStorage.setItem("token", data.token);
      auth.token = data.token;
      auth.user = data.user;
      m.remove();
      notify();
      window.__router?.rerender();
    } catch (e) {
      err.textContent = e.message || "Gagal. Coba lagi.";
    } finally {
      btn.disabled = false;
      btn.textContent = isReg ? "Buat Akun" : "Masuk";
    }
  });
}

// ===== LOGOUT =====
export async function logoutUser() {
  if (auth.token) await api.logout().catch(() => {});
  localStorage.removeItem("token");
  auth.token = null;
  auth.user = null;
  notify();
  window.__router?.rerender();
}
