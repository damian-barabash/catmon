# catmongame.app

Public website + admin panel for **CatMon** (React 19 + Vite + TypeScript, hosted on GitHub Pages).

## Develop

```bash
npm ci
npm run dev        # http://localhost:5173
npm run build      # -> dist/ (also writes dist/404.html for SPA fallback)
npm run preview
```

## Structure

- `src/pages/*` — public pages (`/`, `/contact`, `/blog`, `/blog/:slug`, `/season`, `/privacy`, `/cookies`, `/terms`, `/rules`, `/data-processing`).
- `src/admin/**` — admin panel, mounted at `/admin/*` (separate bundle area, do not mix with the public site).
- `src/i18n/{en,ru,pl,fr}.ts` — UI strings; `en.ts` is the type source. Language = `localStorage.catmon.lang` → `navigator.languages` → `en`.
- `src/lib/api.ts` — client for the Supabase edge function `site-api` (contract in the backend repo). Every call degrades gracefully if the function is not deployed.
- `src/lib/config.ts` — Supabase URL + anon key (public by design), site URL, support e-mail.
- `public/game/*` — SVG art copied from the game (`CatMon/assets`), `public/shots/*` — app screenshots, `public/video/promo-portrait.mp4` — promo.
- SEO: `index.html` (meta, OG/Twitter, JSON-LD), `src/lib/seo.ts` (per-route title/description/canonical/hreflang), `public/sitemap.xml`, `public/robots.txt`, `public/manifest.webmanifest`, `public/og.png`.

## Deploy

**Automatic:** push to `main` → `.github/workflows/deploy.yml` builds with Node 22 and publishes `dist/` via GitHub Pages (Actions source). In the repo settings → Pages, set **Source = GitHub Actions** and **Custom domain = catmongame.app** (the `public/CNAME` file keeps it after each deploy). Enable *Enforce HTTPS* once the certificate is issued.

**Manual:** `npm run deploy` (gh-pages → `gh-pages` branch). Use only one of the two methods.

## DNS (catmongame.app)

At your DNS provider:

| Type  | Name | Value |
|-------|------|-------|
| A     | @    | 185.199.108.153 |
| A     | @    | 185.199.109.153 |
| A     | @    | 185.199.110.153 |
| A     | @    | 185.199.111.153 |
| AAAA  | @    | 2606:50c0:8000::153 |
| AAAA  | @    | 2606:50c0:8001::153 |
| AAAA  | @    | 2606:50c0:8002::153 |
| AAAA  | @    | 2606:50c0:8003::153 |
| CNAME | www  | `<github-user>.github.io` |

Then in GitHub → Settings → Pages → Custom domain: `catmongame.app` → *Check DNS* → wait for the TLS certificate (up to ~1 h) → *Enforce HTTPS*. `www.catmongame.app` will redirect to the apex.

Verify: `dig catmongame.app +short` should list the four A records; `dig www.catmongame.app +short` the CNAME.
