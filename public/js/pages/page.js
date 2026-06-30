import { api } from "../api.js";
import { toast } from "../ui.js";

const TRASH = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>`;

const THEMES = ["aurora", "sunset", "ocean", "mono"];

export async function renderPage() {
  const app = document.getElementById("app");
  app.innerHTML = `<div class="container"><div class="loading-screen"><span class="spinner"></span></div></div>`;

  let bio = null;
  try {
    bio = await api.getMyBio();
  } catch (e) {
    toast(e.message, "err");
  }

  const links = bio?.links || [];
  app.innerHTML = `<div class="container">
    <div class="invoice-header">
      <div><h2>Gerbang</h2><p class="muted">Halaman link-in-bio gratis</p></div>
      ${bio ? `<a class="btn btn-ghost btn-sm" href="/${bio.slug}" target="_blank">Lihat Publik · ${bio.views} views</a>` : ""}
    </div>
    <form class="bio-form card" id="bio-form">
      <div class="field"><label>Username (URL kamu)</label>
        <div class="flex items-center gap-8"><span class="dim" style="font-size:14px">spectra/</span><input id="b-slug" placeholder="username" value="${bio?.slug || ""}" required style="flex:1" /></div>
      </div>
      <div class="field"><label>Judul</label><input id="b-title" placeholder="Nama / Brand kamu" value="${esc(bio?.title) || ""}" required /></div>
      <div class="field"><label>Bio</label><textarea id="b-bio" rows="2" placeholder="Deskripsi singkat">${esc(bio?.bio) || ""}</textarea></div>
      <div class="field"><label>Tema</label><select id="b-theme">${THEMES.map((t) => `<option value="${t}" ${bio?.theme === t ? "selected" : ""}>${t[0].toUpperCase() + t.slice(1)}</option>`).join("")}</select></div>
      <label class="muted" style="font-size:13px;font-weight:600">Links</label>
      <div id="links" class="mt-8">${links.map(linkRow).join("") || linkRow({ label: "", url: "" })}</div>
      <button type="button" class="btn btn-ghost btn-sm mt-8" id="add-link">+ Tambah Link</button>
      <button type="submit" class="btn btn-primary btn-block mt-16">Simpan Halaman</button>
    </form>
  </div>`;

  document.getElementById("add-link").addEventListener("click", () => {
    document.getElementById("links").insertAdjacentHTML("beforeend", linkRow({ label: "", url: "" }));
  });
  document.getElementById("bio-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const linksData = [...document.querySelectorAll(".link-row")].map((r) => ({
      label: r.querySelector(".l-label").value.trim(),
      url: r.querySelector(".l-url").value.trim(),
    })).filter((l) => l.label && l.url);
    try {
      await api.putBio({
        slug: document.getElementById("b-slug").value.trim().toLowerCase(),
        title: document.getElementById("b-title").value.trim(),
        bio: document.getElementById("b-bio").value.trim(),
        theme: document.getElementById("b-theme").value,
        links: linksData,
      });
      toast("Halaman tersimpan!", "ok");
      renderPage();
    } catch (e) { toast(e.message, "err"); }
  });
}

function linkRow(l) {
  return `<div class="item-row link-row">
    <input placeholder="Label" class="l-label" value="${esc(l.label)}" style="flex:1" />
    <input placeholder="https://..." class="l-url" value="${esc(l.url)}" style="flex:2" />
    <button class="btn btn-icon btn-danger" type="button" onclick="this.closest('.link-row').remove()">${TRASH}</button>
  </div>`;
}

function esc(s) {
  return (s || "").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}
