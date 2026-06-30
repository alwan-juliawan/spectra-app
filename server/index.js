import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import authRoutes from "./routes/auth.js";
import invoiceRoutes from "./routes/invoices.js";
import bioRoutes from "./routes/bio.js";
import habitRoutes from "./routes/habits.js";
import { initSchema } from "./db.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(__dirname, "..", "public");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "256kb" }));

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/bio", bioRoutes);
app.use("/api/habits", habitRoutes);

// Static assets
app.use(express.static(PUBLIC));

// SPA fallback — all non-API routes serve index.html (client router handles them)
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(join(PUBLIC, "index.html"));
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Server error" });
});

app.listen(PORT, async () => {
  try {
    await initSchema();
    console.log(`Spectra running on http://localhost:${PORT} (DB ready)`);
  } catch (e) {
    console.error("Schema init failed:", e.message);
  }
});
