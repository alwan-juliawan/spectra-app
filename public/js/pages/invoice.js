import { api } from "../api.js";
import { toast } from "../ui.js";

const TRASH = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`;

function fmt(n, cur = "IDR") {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: cur, minimumFractionDigits: 0 }).format(n);
}
function total(items) {
  return items.reduce((s, i) => s + i.qty * i.price, 0);
}

export async function renderInvoice() {
  const app = document.getElementById("app");
  app.innerHTML = `<div class="container"><div class="loading-screen"><span class="spinner"></span></div></div>`;
  let invoices = [];
  try {
    invoices = await api.getInvoices();
  } catch (e) {
    toast(e.message, "err");
  }

  app.innerHTML = `<div class="container">
    <div class="invoice-header">
      <div><h2>Tagihan</h2><p class="muted">Invoice profesional, gratis</p></div>
      <button class="btn btn-primary" id="new-inv">+ Invoice Baru</button>
    </div>
    <div class="invoice-list" id="inv-list"></div>
  </div>`;

  const list = document.getElementById("inv-list");
  if (!invoices.length) {
    list.innerHTML = `<div class="empty"><div class="empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/></svg></div><p>Belum ada invoice. Buat yang pertama!</p></div>`;
  } else {
    list.innerHTML = invoices.map((inv) => {
      const badge = inv.status === "paid" ? "green" : inv.status === "overdue" ? "red" : "amber";
      const label = inv.status === "paid" ? "Lunas" : inv.status === "overdue" ? "Telat" : "Belum bayar";
      return `<div class="invoice-item">
        <div class="invoice-item-info" data-view="${inv.id}" style="cursor:pointer">
          <h4>${inv.number} · ${inv.client_name}</h4>
          <p>${inv.issue_date} · <span class="badge badge-${badge}">${label}</span></p>
        </div>
        <span class="invoice-total tnum">${fmt(total(inv.items), inv.currency)}</span>
        <div class="invoice-item-actions">
          <button class="btn btn-icon" data-pdf="${inv.id}" title="Download PDF"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></button>
          <button class="btn btn-icon btn-danger" data-del="${inv.id}" title="Hapus">${TRASH}</button>
        </div>
      </div>`;
    }).join("");
  }

  document.getElementById("new-inv").addEventListener("click", () => showForm());
  list.querySelectorAll("[data-view]").forEach((el) => el.addEventListener("click", () => viewInvoice(invoices.find((i) => i.id == el.dataset.view))));
  list.querySelectorAll("[data-pdf]").forEach((el) => el.addEventListener("click", () => downloadPdf(invoices.find((i) => i.id == el.dataset.pdf))));
  list.querySelectorAll("[data-del]").forEach((el) => el.addEventListener("click", async () => {
    if (!confirm("Hapus invoice ini?")) return;
    try { await api.deleteInvoice(el.dataset.del); toast("Invoice dihapus", "ok"); renderInvoice(); }
    catch (e) { toast(e.message, "err"); }
  }));
}

function itemRowHtml() {
  return `<div class="item-row">
    <input placeholder="Deskripsi" class="it-desc" />
    <input placeholder="Qty" type="number" class="it-qty" value="1" style="max-width:70px" />
    <input placeholder="Harga" type="number" class="it-price" value="0" style="max-width:120px" />
    <button class="btn btn-icon btn-danger" type="button" onclick="this.closest('.item-row').remove()">${TRASH}</button>
  </div>`;
}

function showForm() {
  const app = document.getElementById("app");
  app.innerHTML = `<div class="container"><button class="btn btn-ghost btn-sm" id="back">← Kembali</button>
    <h2 class="mt-16">Invoice Baru</h2>
    <form class="invoice-form card mt-16" id="inv-form">
      <div class="field-row">
        <div class="field"><label>Nama Klien *</label><input id="f-client" required /></div>
        <div class="field"><label>Email Klien</label><input id="f-email" type="email" /></div>
      </div>
      <div class="field-row">
        <div class="field"><label>Tanggal Terbit</label><input id="f-issue" type="date" /></div>
        <div class="field"><label>Jatuh Tempo</label><input id="f-due" type="date" /></div>
      </div>
      <div class="field"><label>Mata Uang</label><select id="f-cur"><option value="IDR">IDR (Rp)</option><option value="USD">USD ($)</option><option value="EUR">EUR (€)</option></select></div>
      <label class="muted" style="font-size:13px;font-weight:600">Item</label>
      <div id="items" class="mt-8">${itemRowHtml()}</div>
      <button type="button" class="btn btn-ghost btn-sm mt-8" id="add-item">+ Tambah Item</button>
      <div class="field mt-16"><label>Catatan</label><textarea id="f-notes" rows="2"></textarea></div>
      <button type="submit" class="btn btn-primary btn-block mt-8">Simpan Invoice</button>
    </form></div>`;

  document.getElementById("f-issue").value = new Date().toISOString().slice(0, 10);
  document.getElementById("back").addEventListener("click", renderInvoice);
  document.getElementById("add-item").addEventListener("click", () => {
    document.getElementById("items").insertAdjacentHTML("beforeend", itemRowHtml());
  });
  document.getElementById("inv-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const items = [...document.querySelectorAll(".item-row")].map((r) => ({
      desc: r.querySelector(".it-desc").value.trim(),
      qty: +r.querySelector(".it-qty").value || 1,
      price: +r.querySelector(".it-price").value || 0,
    })).filter((i) => i.desc);
    if (!items.length) return toast("Tambahkan minimal 1 item", "err");
    try {
      await api.createInvoice({
        client_name: document.getElementById("f-client").value.trim(),
        client_email: document.getElementById("f-email").value.trim(),
        issue_date: document.getElementById("f-issue").value,
        due_date: document.getElementById("f-due").value,
        currency: document.getElementById("f-cur").value,
        notes: document.getElementById("f-notes").value.trim(),
        items,
      });
      toast("Invoice dibuat!", "ok");
      renderInvoice();
    } catch (e) { toast(e.message, "err"); }
  });
}

function viewInvoice(inv) {
  const app = document.getElementById("app");
  const rows = inv.items.map((i) => `<tr><td>${i.desc}</td><td class="tnum">${i.qty}</td><td class="tnum">${fmt(i.price, inv.currency)}</td><td class="tnum">${fmt(i.qty * i.price, inv.currency)}</td></tr>`).join("");
  app.innerHTML = `<div class="container"><button class="btn btn-ghost btn-sm" id="back">← Kembali</button>
    <div class="invoice-detail card mt-16">
      <div class="flex between items-center"><div><h2>${inv.number}</h2><p class="muted">${inv.client_name}${inv.client_email ? " · " + inv.client_email : ""}</p></div>
      <button class="btn btn-primary btn-sm" id="pdf">Download PDF</button></div>
      <p class="muted mt-8" style="font-size:13px">Terbit: ${inv.issue_date}${inv.due_date ? " · Tempo: " + inv.due_date : ""}</p>
      <table><thead><tr><th>Deskripsi</th><th>Qty</th><th>Harga</th><th>Subtotal</th></tr></thead>
      <tbody>${rows}<tr class="total-row"><td colspan="3">Total</td><td class="tnum">${fmt(total(inv.items), inv.currency)}</td></tr></tbody></table>
      ${inv.notes ? `<p class="muted mt-16" style="font-size:13px">${inv.notes}</p>` : ""}
      <div class="flex gap-8 mt-24">
        <button class="btn btn-ghost btn-sm" data-st="paid">Tandai Lunas</button>
        <button class="btn btn-ghost btn-sm" data-st="unpaid">Belum Bayar</button>
        <button class="btn btn-ghost btn-sm" data-st="overdue">Telat</button>
      </div>
    </div></div>`;
  document.getElementById("back").addEventListener("click", renderInvoice);
  document.getElementById("pdf").addEventListener("click", () => downloadPdf(inv));
  app.querySelectorAll("[data-st]").forEach((b) => b.addEventListener("click", async () => {
    try { await api.updateStatus(inv.id, b.dataset.st); toast("Status diupdate", "ok"); }
    catch (e) { toast(e.message, "err"); }
  }));
}

function downloadPdf(inv) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFontSize(22); doc.text("INVOICE", 20, 25);
  doc.setFontSize(11); doc.text(inv.number, 20, 33);
  doc.setFontSize(10);
  doc.text(`Klien: ${inv.client_name}`, 20, 48);
  if (inv.client_email) doc.text(inv.client_email, 20, 54);
  doc.text(`Terbit: ${inv.issue_date}`, 140, 48);
  if (inv.due_date) doc.text(`Tempo: ${inv.due_date}`, 140, 54);
  let y = 72;
  doc.setFillColor(240, 240, 245); doc.rect(20, y - 6, 170, 8, "F");
  doc.text("Deskripsi", 22, y); doc.text("Qty", 120, y); doc.text("Harga", 140, y); doc.text("Subtotal", 168, y);
  y += 10;
  inv.items.forEach((i) => {
    doc.text(String(i.desc).slice(0, 50), 22, y);
    doc.text(String(i.qty), 120, y);
    doc.text(fmt(i.price, inv.currency), 140, y);
    doc.text(fmt(i.qty * i.price, inv.currency), 168, y);
    y += 8;
  });
  y += 4; doc.setFontSize(13);
  doc.text(`Total: ${fmt(total(inv.items), inv.currency)}`, 140, y);
  if (inv.notes) { doc.setFontSize(9); doc.text(inv.notes, 20, y + 14); }
  doc.save(`${inv.number}.pdf`);
}
