import { api } from "../api.js";
import { toast } from "../ui.js";

const TRASH = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`;
const WEEKDAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

function todayIdx() { return new Date().getDay(); }

export async function renderHabit() {
  const app = document.getElementById("app");
  app.innerHTML = `<div class="container"><div class="loading-screen"><span class="spinner"></span></div></div>`;

  let habits = [], stats = [];
  try {
    [habits, stats] = await Promise.all([api.getHabits(), api.getHabitStats()]);
  } catch (e) { toast(e.message, "err"); }

  app.innerHTML = `<div class="container">
    <div class="invoice-header">
      <div><h2>Pulih</h2><p class="muted">Habit tracker harian</p></div>
      <button class="btn btn-primary" id="new-habit">+ Kebiasaan Baru</button>
    </div>
    <div class="habit-grid" id="habit-grid"></div>
    <div id="habit-detail" class="mt-24"></div>
  </div>`;

  const grid = document.getElementById("habit-grid");
  if (!habits.length) {
    grid.innerHTML = `<div class="empty" style="grid-column:1/-1"><div class="empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></div><p>Belum ada kebiasaan. Mulai satu!</p></div>`;
  } else {
    grid.innerHTML = habits.map((h) => {
      const s = stats.find((x) => x.id === h.id);
      const done = h.doneToday;
      return `<div class="habit-card ${done ? 'habit-card-done' : ''}">
        <button class="habit-check ${done ? 'done' : ''}" data-id="${h.id}">${done ? "✓" : ""}</button>
        <div class="habit-name">${esc(h.name)}</div>
        <div class="habit-streak">🔥 streak <strong>${s?.streak || 0}</strong> · total ${s?.total || 0}</div>
        <div class="habit-week">${renderWeek(s?.seven || [])}</div>
        <button class="btn btn-icon btn-danger btn-sm" style="width:32px;height:32px;margin-top:12px" data-del="${h.id}" title="Hapus">${TRASH}</button>
      </div>`;
    }).join("");
  }

  grid.querySelectorAll(".habit-check").forEach((el) =>
    el.addEventListener("click", async () => {
      try {
        const r = await api.toggleHabit(el.dataset.id);
        el.textContent = r.doneToday ? "✓" : "";
        el.classList.toggle("done", r.doneToday);
        el.closest(".habit-card").classList.toggle("habit-card-done", r.doneToday);
      } catch (e) { toast(e.message, "err"); }
    })
  );
  grid.querySelectorAll("[data-del]").forEach((el) =>
    el.addEventListener("click", async () => {
      if (!confirm("Hapus kebiasaan ini?")) return;
      try { await api.deleteHabit(el.dataset.id); toast("Dihapus", "ok"); renderHabit(); }
      catch (e) { toast(e.message, "err"); }
    })
  );

  document.getElementById("new-habit").addEventListener("click", showForm);
}

function renderWeek(dates) {
  const today = new Date().toISOString().slice(0, 10);
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const ds = d.toISOString().slice(0, 10);
    days.push({ ds, done: dates.includes(ds), today: ds === today });
  }
  return days.map((d) => `<div class="habit-day ${d.done ? 'done' : ''}" title="${d.ds}" style="${d.today ? 'outline:1px solid var(--fg-muted);outline-offset:1px' : ''}"></div>`).join("");
}

function showForm() {
  const app = document.getElementById("app");
  app.innerHTML = `<div class="container"><button class="btn btn-ghost btn-sm" id="back">← Kembali</button>
    <form class="habit-form card mt-16" id="h-form">
      <div class="field"><label>Nama Kebiasaan *</label><input id="h-name" placeholder="Minum air, Olahraga, Meditasi..." required /></div>
      <div class="field-row">
        <div class="field"><label>Warna</label><select id="h-color"><option value="violet">Ungu</option><option value="green">Hijau</option><option value="amber">Kuning</option><option value="red">Merah</option></select></div>
        <div class="field"><label>Ikon</label><select id="h-icon"><option value="target">🎯 Target</option><option value="heart">❤️ Heart</option><option value="zap">⚡ Zap</option><option value="star">⭐ Star</option></select></div>
      </div>
      <button type="submit" class="btn btn-primary btn-block">Simpan</button>
    </form></div>`;
  document.getElementById("back").addEventListener("click", renderHabit);
  document.getElementById("h-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      await api.createHabit({
        name: document.getElementById("h-name").value.trim(),
        color: document.getElementById("h-color").value,
        icon: document.getElementById("h-icon").value,
      });
      toast("Kebiasaan ditambahkan!", "ok");
      renderHabit();
    } catch (e) { toast(e.message, "err"); }
  });
}

function esc(s) {
  return (s || "").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}
