import { Router } from "express";
import { query } from "../db.js";
import {
  hashPassword,
  verifyPassword,
  createSession,
  destroySession,
  authRequired,
} from "../middleware/auth.js";

const router = Router();

router.post("/register", async (req, res, next) => {
  try {
    let { email, name, password } = req.body;
    if (!email || !name || !password)
      return res.status(400).json({ error: "email, name, password required" });
    if (password.length < 6)
      return res.status(400).json({ error: "Password at least 6 chars" });

    email = email.trim().toLowerCase();

    const { rows: existing } = await query("SELECT id, email FROM users WHERE LOWER(email) = $1", [email]);
    if (existing.length) return res.status(409).json({ error: "Email already used" });

    const { hash, salt } = hashPassword(password);
    const { rows: ins } = await query(
      "INSERT INTO users (email, name, pass_hash, pass_salt) VALUES ($1,$2,$3,$4) RETURNING id, email, name",
      [email, name, hash, salt]
    );

    const user = ins[0];
    const token = await createSession(user.id);
    res.status(201).json({ token, user });
  } catch (e) { next(e); }
});

router.post("/login", async (req, res, next) => {
  try {
    let { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "email, password required" });

    email = email.trim().toLowerCase();

    const { rows } = await query("SELECT * FROM users WHERE LOWER(email) = $1", [email]);
    if (!rows.length) return res.status(401).json({ error: "Invalid credentials" });
    const user = rows[0];

    if (!verifyPassword(password, user.pass_hash, user.pass_salt))
      return res.status(401).json({ error: "Invalid credentials" });

    const token = await createSession(user.id);
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (e) { next(e); }
});

router.get("/me", async (req, res, next) => {
  try { await authRequired(req, res, () => res.json({ user: req.user })); }
  catch (e) { next(e); }
});

router.post("/logout", async (req, res, next) => {
  try {
    await authRequired(req, res, async () => {
      await destroySession(req.token);
      res.json({ ok: true });
    });
  } catch (e) { next(e); }
});

export default router;
