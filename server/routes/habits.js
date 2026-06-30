import { Router } from "express";
import { query } from "../db.js";
import { authRequired } from "../middleware/auth.js";

const router = Router();
router.use(authRequired);

// GET /api/habits — list with today's log status
router.get("/", async (req, res, next) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const { rows: habits } = await query(
      "SELECT * FROM habits WHERE user_id = $1 ORDER BY created_at", [req.user.id]
    );
    const { rows: logs } = await query(
      `SELECT habit_id FROM habit_logs WHERE date = $1
       AND habit_id IN (SELECT id FROM habits WHERE user_id = $2)`,
      [today, req.user.id]
    );
    const done = new Set(logs.map(l => l.habit_id));
    res.json(habits.map(h => ({ ...h, doneToday: done.has(h.id) })));
  } catch (e) { next(e); }
});

// POST /api/habits
router.post("/", async (req, res, next) => {
  try {
    const { name, color, icon } = req.body;
    if (!name) return res.status(400).json({ error: "name required" });
    const { rows } = await query(
      "INSERT INTO habits (user_id, name, color, icon) VALUES ($1,$2,$3,$4) RETURNING *",
      [req.user.id, name, color || "violet", icon || "target"]
    );
    res.status(201).json({ ...rows[0], doneToday: false });
  } catch (e) { next(e); }
});

// GET /api/habits/stats  (must be before /:id routes)
router.get("/stats", async (req, res, next) => {
  try {
    const { rows: habits } = await query("SELECT * FROM habits WHERE user_id = $1", [req.user.id]);
    const result = [];
    for (const h of habits) {
      const { rows: [t] } = await query(
        "SELECT COUNT(*)::int c FROM habit_logs WHERE habit_id = $1", [h.id]
      );
      const { rows: sevenRows } = await query(
        `SELECT date FROM habit_logs WHERE habit_id = $1
         AND date >= to_char(current_date - 6, 'YYYY-MM-DD') ORDER BY date`, [h.id]
      );
      const { rows: allRows } = await query(
        "SELECT date FROM habit_logs WHERE habit_id = $1 ORDER BY date DESC", [h.id]
      );
      const allDates = allRows.map(r => r.date);
      let streak = 0;
      for (let i = 0; i < allDates.length; i++) {
        const exp = new Date();
        exp.setDate(exp.getDate() - i);
        if (allDates[i] === exp.toISOString().slice(0, 10)) streak++;
        else break;
      }
      result.push({ ...h, total: t.c, seven: sevenRows.map(r => r.date), streak });
    }
    res.json(result);
  } catch (e) { next(e); }
});

// DELETE /api/habits/:id
router.delete("/:id", async (req, res, next) => {
  try {
    const { rowCount } = await query(
      "DELETE FROM habits WHERE id = $1 AND user_id = $2", [req.params.id, req.user.id]
    );
    if (!rowCount) return res.status(404).json({ error: "Not found" });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// POST /api/habits/:id/toggle
router.post("/:id/toggle", async (req, res, next) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const { rows: habit } = await query(
      "SELECT id FROM habits WHERE id = $1 AND user_id = $2", [req.params.id, req.user.id]
    );
    if (!habit.length) return res.status(404).json({ error: "Not found" });

    const { rows: existing } = await query(
      "SELECT id FROM habit_logs WHERE habit_id = $1 AND date = $2", [req.params.id, today]
    );
    if (existing.length) {
      await query("DELETE FROM habit_logs WHERE id = $1", [existing[0].id]);
      res.json({ doneToday: false });
    } else {
      await query("INSERT INTO habit_logs (habit_id, date) VALUES ($1,$2)", [req.params.id, today]);
      res.json({ doneToday: true });
    }
  } catch (e) { next(e); }
});

export default router;
