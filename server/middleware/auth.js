import crypto from "crypto";
import { query } from "../db.js";

// ===== Password hashing (scrypt — built-in, no deps) =====
export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return { hash, salt };
}

export function verifyPassword(password, hash, salt) {
  const candidate = crypto.scryptSync(password, salt, 64).toString("hex");
  const a = Buffer.from(candidate, "hex");
  const b = Buffer.from(hash, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// ===== Sessions =====
export async function createSession(userId) {
  const token = crypto.randomBytes(32).toString("hex");
  await query("INSERT INTO sessions (token, user_id) VALUES ($1, $2)", [token, userId]);
  return token;
}

export async function destroySession(token) {
  await query("DELETE FROM sessions WHERE token = $1", [token]);
}

// ===== Middleware =====
export async function authRequired(req, res, next) {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Not authenticated" });

    const { rows } = await query(
      `SELECT u.id, u.email, u.name FROM sessions s
       JOIN users u ON u.id = s.user_id WHERE s.token = $1`,
      [token]
    );

    if (!rows.length) return res.status(401).json({ error: "Invalid session" });
    req.user = rows[0];
    req.token = token;
    next();
  } catch (e) {
    next(e);
  }
}
