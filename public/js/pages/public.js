import { api } from "../api.js";

export async function renderPublicBio(slug) {
  const root = document.getElementById("root");
  let bio;
  try {
    bio = await api.getPublicBio(slug);
  } catch {
    root.innerHTML = `<div class="public-bio"><h2>404</h2><p class="muted mt-8">Halaman tidak ditemukan</p></div>`;
    return;
  }

  root.innerHTML = `<div class="public-bio public-bio-aurora">
    <h1 class="bio-preview-title">${esc(bio.title)}</h1>
    ${bio.bio ? `<p class="bio-preview-bio">${esc(bio.bio)}</p>` : ""}
    <div class="bio-links" style="width:100%;max-width:400px">
      ${bio.links.map((l) => `<a class="bio-link" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join("")}
    </div>
    <p class="muted mt-24" style="font-size:12px">Spectra · Gerbang</p>
  </div>`;
}

function esc(s) {
  return (s || "").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}
