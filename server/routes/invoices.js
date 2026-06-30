import { Router } from "express";
import db from "../db.js";
import { authRequired } from "../middleware/auth.js";

const router = Router();

// All routes require auth
router.use(authRequired);

function invoiceRow(row) {
  return { ...row, items: JSON.parse(row.items) };
}

// GET /api/invoices
router.get("/", (req, res) => {
  const rows = db
    .prepare("SELECT * FROM invoices WHERE user_id = ? ORDER BY created_at DESC")
    .all(req.user.id);
  res.json(rows.map(invoiceRow));
});

// POST /api/invoices
router.post("/", (req, res) => {
  const { client_name, client_email, issue_date, due_date, items, notes, currency } =
    req.body;
  if (!client_name || !items?.length)
    return res.status(400).json({ error: "client_name and items required" });

  const count =
    db
      .prepare("SELECT COUNT(*) c FROM invoices WHERE user_id = ?")
      .get(req.user.id).c + 1;
  const number = `INV-${String(count).padStart(4, "0")}`;
  const itemsJson = JSON.stringify(
    items.map((i) => ({ desc: i.desc, qty: i.qty || 1, price: i.price || 0 }))
  );

  const result = db
    .prepare(
      `INSERT INTO invoices (user_id, number, client_name, client_email, issue_date, due_date, items, notes, currency)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      req.user.id,
      number,
      client_name,
      client_email || null,
      issue_date || new Date().toISOString().slice(0, 10),
      due_date || null,
      itemsJson,
      notes || null,
      currency || "IDR"
    );

  const row = db.prepare("SELECT * FROM invoices WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json(invoiceRow(row));
});

// GET /api/invoices/:id
router.get("/:id", (req, res) => {
  const row = db
    .prepare("SELECT * FROM invoices WHERE id = ? AND user_id = ?")
    .get(req.params.id, req.user.id);
  if (!row) return res.status(404).json({ error: "Not found" });
  res.json(invoiceRow(row));
});

// PATCH /api/invoices/:id/status
router.patch("/:id/status", (req, res) => {
  const { status } = req.body;
  if (!["paid", "unpaid", "overdue"].includes(status))
    return res.status(400).json({ error: "Invalid status" });

  const result = db
    .prepare("UPDATE invoices SET status = ? WHERE id = ? AND user_id = ?")
    .run(status, req.params.id, req.user.id);
  if (!result.changes) return res.status(404).json({ error: "Not found" });
  res.json({ ok: true });
});

// DELETE /api/invoices/:id
router.delete("/:id", (req, res) => {
  const result = db
    .prepare("DELETE FROM invoices WHERE id = ? AND user_id = ?")
    .run(req.params.id, req.user.id);
  if (!result.changes) return res.status(404).json({ error: "Not found" });
  res.json({ ok: true });
});

export default router;
