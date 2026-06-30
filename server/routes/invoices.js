import { Router } from "express";
import { query } from "../db.js";
import { authRequired } from "../middleware/auth.js";

const router = Router();
router.use(authRequired);

// GET /api/invoices
router.get("/", async (req, res, next) => {
  try {
    const { rows } = await query(
      "SELECT * FROM invoices WHERE user_id = $1 ORDER BY created_at DESC", [req.user.id]
    );
    res.json(rows.map(r => ({ ...r, items: r.items || [] })));
  } catch (e) { next(e); }
});

// POST /api/invoices
router.post("/", async (req, res, next) => {
  try {
    const { client_name, client_email, issue_date, due_date, items, notes, currency } = req.body;
    if (!client_name || !items?.length)
      return res.status(400).json({ error: "client_name and items required" });

    const { rows: [cnt] } = await query(
      "SELECT COUNT(*)::int + 1 AS c FROM invoices WHERE user_id = $1", [req.user.id]
    );
    const number = `INV-${String(cnt.c).padStart(4, "0")}`;

    const { rows } = await query(
      `INSERT INTO invoices (user_id, number, client_name, client_email, issue_date, due_date, items, notes, currency)
       VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9) RETURNING *`,
      [
        req.user.id, number, client_name, client_email || null,
        issue_date || new Date().toISOString().slice(0, 10),
        due_date || null,
        JSON.stringify(items.map(i => ({ desc: i.desc, qty: i.qty || 1, price: i.price || 0 }))),
        notes || null, currency || "IDR",
      ]
    );
    res.status(201).json({ ...rows[0], items: rows[0].items || [] });
  } catch (e) { next(e); }
});

// GET /api/invoices/:id
router.get("/:id", async (req, res, next) => {
  try {
    const { rows } = await query(
      "SELECT * FROM invoices WHERE id = $1 AND user_id = $2", [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Not found" });
    res.json({ ...rows[0], items: rows[0].items || [] });
  } catch (e) { next(e); }
});

// PATCH /api/invoices/:id/status
router.patch("/:id/status", async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!["paid", "unpaid", "overdue"].includes(status))
      return res.status(400).json({ error: "Invalid status" });

    const { rowCount } = await query(
      "UPDATE invoices SET status = $1 WHERE id = $2 AND user_id = $3",
      [status, req.params.id, req.user.id]
    );
    if (!rowCount) return res.status(404).json({ error: "Not found" });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// DELETE /api/invoices/:id
router.delete("/:id", async (req, res, next) => {
  try {
    const { rowCount } = await query(
      "DELETE FROM invoices WHERE id = $1 AND user_id = $2", [req.params.id, req.user.id]
    );
    if (!rowCount) return res.status(404).json({ error: "Not found" });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default router;
