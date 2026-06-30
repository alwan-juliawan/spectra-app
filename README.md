# Spectra

Tiga alat gratis dalam satu platform. **Tagihan** (invoice generator), **Gerbang** (link-in-bio), **Pulih** (habit tracker). Tanpa biaya, tanpa batas.

Dibuat untuk kompetisi vibe coding internasional.

## Tools

| Tool | Fungsi |
| --- | --- |
| 💰 **Tagihan** | Bikin invoice profesional, export PDF, track status pembayaran |
| 🔗 **Gerbang** | Halaman link-in-bio custom, visitor counter, multi-tema |
| 📈 **Pulih** | Habit tracker harian, streak, progress 7-hari visual |

## Stack

| Layer | Tech |
| --- | --- |
| Frontend | Vanilla SPA (zero framework), ES Modules |
| Backend | Node.js + Express |
| Database | PostgreSQL (Supabase) |
| Auth | Session token + scrypt (built-in crypto) |
| PDF | jsPDF (client-side) |

Zero build step. Zero heavy dependencies.

## Run locally

```bash
# 1. Setup .env (see env.example)
PGUSER=postgres.<project-ref>
PGPASSWORD=<db-password>
PGHOST=aws-1-ap-southeast-1.pooler.supabase.com
PGPORT=6543
PGDATABASE=postgres

# 2. Start
npm install
node --env-file=.env server/index.js
# buka http://localhost:3000
```

## Deploy (Render)

1. Fork/push repo ke GitHub
2. **Render Dashboard → New Web Service** → Connect repo
3. **Build Command:** `npm install`
4. **Start Command:** `PORT=3000 node server/index.js`
5. Add **Environment Variables**:
   - `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`
   - (atau `DATABASE_URL` encode-URL)
6. Deploy → selesai

## API

```
POST   /api/auth/register      { email, name, password }
POST   /api/auth/login         { email, password }
GET    /api/auth/me
POST   /api/auth/logout

GET    /api/invoices
POST   /api/invoices           { client_name, items[], currency, ... }
GET    /api/invoices/:id
PATCH  /api/invoices/:id/status { status }
DELETE /api/invoices/:id

GET    /api/bio                (my page)
PUT    /api/bio                { slug, title, bio, theme, links[] }
GET    /api/bio/:slug          (public, no auth)

GET    /api/habits
POST   /api/habits             { name, color, icon }
DELETE /api/habits/:id
POST   /api/habits/:id/toggle
GET    /api/habits/stats
```

## Structure

```
spectra/
├── server/
│   ├── index.js          # Express entry + SPA fallback
│   ├── db.js             # PostgreSQL pool + schema init
│   ├── middleware/auth.js
│   └── routes/           # auth, invoices, bio, habits
├── public/
│   ├── index.html        # SPA shell
│   ├── css/              # base.css (tokens), app.css
│   └── js/               # app.js (router), api, auth, ui, pages/
└── package.json
```

## Features

- Session-based auth dengan scrypt password hashing
- Public link-in-bio pages di `/:slug` dengan view counter
- Invoice PDF export client-side (no server load)
- Habit streak calculation + 7-day visual
- Dark/light theme (persisted)
- Polished UI: concentric radius, shadow-as-border, scale-on-press, tabular-nums
- Responsive, semantic, accessible

## License

MIT
