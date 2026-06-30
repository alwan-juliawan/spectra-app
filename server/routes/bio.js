import { Router } from "express";
import { query } from "../db.js";
import { authRequired } from "../middleware/auth.js";

const router = Router();

// Public: GET /api/bio/:slug
router.get("/:slug", async (req, res, next) => {
  try {
    const { rows } = await query(
      "SELECT id, user_id, slug, title, bio, theme, links, created_at FROM bio_pages WHERE slug = $1",
      [req.params.slug]
    );
    if (!rows.length) return res.status(404).json({ error: "Not found" });
    await query("UPDATE bio_pages SET views = views + 1 WHERE id = $1", [rows[0].id]);
    res.json({ ...rows[0], links: rows[0].links || [] });
  } catch (e) { next(e); }
});

// Auth routes
router.use(authRequired);

// GET /api/bio — my page
router.get("/", async (req, res, next) => {
  try {
    const { rows } = await query("SELECT * FROM bio_pages WHERE user_id = $1", [req.user.id]);
    if (!rows.length) return res.json(null);
    res.json({ ...rows[0], links: rows[0].links || [] });
  } catch (e) { next(e); }
});

// PUT /api/bio — create or update
router.put("/", async (req, res, next) => {
  try {
    const { slug, title, bio, theme, links } = req.body;
    if (!slug || !title) return res.status(400).json({ error: "slug and title required" });
    if (!/^[a-z0-9-]{3,30}$/.test(slug))
      return res.status(400).json({ error: "slugs: 3-30 chars, lowercase, hyphen" });

    const { rows: clash } = await query(
      "SELECT id FROM bio_pages WHERE slug = $1 AND user_id != $2", [slug, req.user.id]
    );
    if (clash.length) return res.status(409).json({ error: "Slug already taken" });

    const { rows: old } = await query("SELECT id FROM bio_pages WHERE user_id = $1", [req.user.id]);
    const linksJson = JSON.stringify(links || []);

    if (old.length) {
      await query(
        "UPDATE bio_pages SET slug=$1, title=$2, bio=$3, theme=$4, links=$5::jsonb WHERE user_id=$6",
        [slug, title, bio || null, theme || "aurora", linksJson, req.user.id]
      );
    } else {
      await query(
        "INSERT INTO bio_pages (user_id, slug, title, bio, theme, links) VALUES ($1,$2,$3,$4,$5,$6::jsonb)",
        [req.user.id, slug, title, bio || null, theme || "aurora", linksJson]
      );
    }

    const { rows } = await query("SELECT * FROM bio_pages WHERE user_id = $1", [req.user.id]);
    res.status(old.length ? 200 : 201).json({ ...rows[0], links: rows[0].links || [] });
  } catch (e) { next(e); }
});

export default router;
