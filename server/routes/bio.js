import { Router } from "express";
import db from "../db.js";
import { authRequired } from "../middleware/auth.js";

const router = Router();

// Public: GET /api/bio/:slug — any visitor (no auth)
router.get("/:slug", (req, res) => {
  const row = db
    .prepare(
      "SELECT id, user_id, slug, title, bio, theme, links, created_at FROM bio_pages WHERE slug = ?"
    )
    .get(req.params.slug);
  if (!row) return res.status(404).json({ error: "Not found" });
  // increment views
  db.prepare("UPDATE bio_pages SET views = views + 1 WHERE id = ?").run(row.id);
  res.json({ ...row, links: JSON.parse(row.links) });
});

// Auth routes below
router.use(authRequired);

// GET /api/bio — my page
router.get("/", (req, res) => {
  const row = db.prepare("SELECT * FROM bio_pages WHERE user_id = ?").get(req.user.id);
  if (!row) return res.json(null);
  res.json({ ...row, links: JSON.parse(row.links) });
});

// PUT /api/bio — create or update my page
router.put("/", (req, res) => {
  const { slug, title, bio, theme, links } = req.body;
  if (!slug || !title)
    return res.status(400).json({ error: "slug and title required" });

  if (!/^[a-z0-9-]{3,30}$/.test(slug))
    return res.status(400).json({ error: "slugs: 3-30 chars, lowercase, hyphen" });

  const existing = db.prepare("SELECT id FROM bio_pages WHERE slug = ? AND user_id != ?").get(slug, req.user.id);
  if (existing) return res.status(409).json({ error: "Slug already taken" });

  const linksJson = JSON.stringify(links || []);
  const old = db.prepare("SELECT id FROM bio_pages WHERE user_id = ?").get(req.user.id);

  if (old) {
    db.prepare(
      "UPDATE bio_pages SET slug=?, title=?, bio=?, theme=?, links=? WHERE user_id=?"
    ).run(slug, title, bio || null, theme || "aurora", linksJson, req.user.id);
  } else {
    db.prepare(
      "INSERT INTO bio_pages (user_id, slug, title, bio, theme, links) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(req.user.id, slug, title, bio || null, theme || "aurora", linksJson);
  }

  const row = db.prepare("SELECT * FROM bio_pages WHERE user_id = ?").get(req.user.id);
  res.status(old ? 200 : 201).json({ ...row, links: JSON.parse(row.links) });
});

export default router;
