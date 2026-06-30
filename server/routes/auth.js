import { Router } from "express";
import db from "../db.js";
import {
  hashPassword,
  verifyPassword,
  createSession,
  destroySession,
  authRequired,
} from "../middleware/auth.js";

const router = Router();

// POST /api/auth/register
router.post("/register", (req, res) => {
  const { email, name, password } = req.body;
  if (!email || !name || !password)
    return res.status(400).json({ error: "email, name, password required" });
  if (password.length < 6)
    return res.status(400).json({ error: "Password at least 6 chars" });

  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing) return res.status(409).json({ error: "Email already used" });

  const { hash, salt } = hashPassword(password);
  const result = db
    .prepare("INSERT INTO users (email, name, pass_hash, pass_salt) VALUES (?, ?, ?, ?)")
    .run(email, name, hash, salt);

  const token = createSession(result.lastInsertRowid);
  res.status(201).json({ token, user: { id: result.lastInsertRowid, email, name } });
});

// POST /api/auth/login
router.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "email, password required" });

  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  if (!verifyPassword(password, user.pass_hash, user.pass_salt))
    return res.status(401).json({ error: "Invalid credentials" });

  const token = createSession(user.id);
  res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
});

// GET /api/auth/me
router.get("/me", authRequired, (req, res) => {
  res.json({ user: req.user });
});

// POST /api/auth/logout
router.post("/logout", authRequired, (req, res) => {
  destroySession(req.token);
  res.json({ ok: true });
});

export default router;
