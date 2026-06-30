import { Router } from "express";
import db from "../db.js";
import { authRequired } from "../middleware/auth.js";

const router = Router();
router.use(authRequired);

// GET /api/habits — list with today's log status
router.get("/", (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const habits = db.prepare("SELECT * FROM habits WHERE user_id = ? ORDER BY created_at").all(req.user.id);
  const logs = db
    .prepare("SELECT habit_id FROM habit_logs WHERE date = ? AND habit_id IN (SELECT id FROM habits WHERE user_id = ?)")
    .all(today, req.user.id);
  const loggedIds = new Set(logs.map((l) => l.habit_id));

  const result = habits.map((h) => ({
    ...h,
    doneToday: loggedIds.has(h.id),
  }));

  res.json(result);
});

// POST /api/habits
router.post("/", (req, res) => {
  const { name, color, icon } = req.body;
  if (!name) return res.status(400).json({ error: "name required" });

  const result = db
    .prepare("INSERT INTO habits (user_id, name, color, icon) VALUES (?, ?, ?, ?)")
    .run(req.user.id, name, color || "violet", icon || "target");
  const row = db.prepare("SELECT * FROM habits WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json({ ...row, doneToday: false });
});

// DELETE /api/habits/:id
router.delete("/:id", (req, res) => {
  const result = db
    .prepare("DELETE FROM habits WHERE id = ? AND user_id = ?")
    .run(req.params.id, req.user.id);
  if (!result.changes) return res.status(404).json({ error: "Not found" });
  res.json({ ok: true });
});

// POST /api/habits/:id/toggle
router.post("/:id/toggle", (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const habit = db
    .prepare("SELECT id FROM habits WHERE id = ? AND user_id = ?")
    .get(req.params.id, req.user.id);
  if (!habit) return res.status(404).json({ error: "Not found" });

  const existing = db
    .prepare("SELECT id FROM habit_logs WHERE habit_id = ? AND date = ?")
    .get(req.params.id, today);

  if (existing) {
    db.prepare("DELETE FROM habit_logs WHERE id = ?").run(existing.id);
    res.json({ doneToday: false });
  } else {
    db.prepare("INSERT INTO habit_logs (habit_id, date) VALUES (?, ?)").run(req.params.id, today);
    res.json({ doneToday: true });
  }
});

// GET /api/habits/stats
router.get("/stats", (req, res) => {
  const habits = db.prepare("SELECT * FROM habits WHERE user_id = ?").all(req.user.id);
  const result = habits.map((h) => {
    const total = db
      .prepare("SELECT COUNT(*) c FROM habit_logs WHERE habit_id = ?")
      .get(h.id).c;
    const seven = db
      .prepare(
        `SELECT date FROM habit_logs WHERE habit_id = ? AND date >= date('now','-6 days') ORDER BY date`
      )
      .all(h.id)
      .map((r) => r.date);

    // compute streak
    const allDates = db
      .prepare("SELECT date FROM habit_logs WHERE habit_id = ? ORDER BY date DESC")
      .all(h.id)
      .map((r) => r.date);

    let streak = 0;
    for (let i = 0; i < allDates.length; i++) {
      const expected = new Date();
      expected.setDate(expected.getDate() - i);
      const expectedStr = expected.toISOString().slice(0, 10);
      if (allDates[i] === expectedStr) streak++;
      else break;
    }

    return {
      ...h,
      total,
      seven,
      streak,
    };
  });
  res.json(result);
});

export default router;
