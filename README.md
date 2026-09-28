# Scribd Downloader — website (Vercel-ready)

Paste a Scribd document URL → preview pages → download PDF. Includes an admin
panel (blog CMS, homepage editor, ads manager, SEO controls).

## Features

- **Downloader** — scrapes public Scribd documents, uploads the PDF to Vercel Blob,
  returns a download link. Built-in **PDF preview with page numbers** (PDF.js):
  prev/next, zoom, page X of Y.
- **Admin panel** (`/admin.html`) — password protected:
  - Blog posts: add / edit / delete (title, slug, excerpt, date, HTML content)
  - Homepage: hero text, features, how-it-works steps, FAQs
  - Ads: 8 prebuilt placements (header, below hero, above/below download button,
    in-content, above footer, blog top/bottom) — paste any ad code per slot
  - SEO: edit `robots.txt`, control sitemap contents (homepage, posts, extra URLs)
- **Blog** — posts render at `/blog/:slug` with meta tags + canonical (SEO friendly).
- **Sitemap** — live at `/sitemap.xml` (generated from posts + settings).
- **Robots** — live at `/robots.txt` (admin-controlled).
- Content is stored as JSON in Vercel Blob — edits go live instantly, no redeploy.

## Project structure

```
api/scrape.js        scrape → Blob → { downloadUrl }
api/cms.js           public site content (JSON)
api/admin-login.js   password → signed session cookie
api/admin-save.js    save homepage/posts/ads/seo (auth required)
api/sitemap.js       → /sitemap.xml
api/robots.js        → /robots.txt
api/post/[slug].js   → /blog/:slug (server-rendered)
api/_lib.js          shared: Blob CMS, auth, defaults
public/index.html    professional frontend + PDF preview
public/admin.html    admin panel
vercel.json          300s timeout + rewrites
```

## Vercel setup (one-time, dashboard me)

1. **Deployment Protection OFF** — project → Settings → Deployment Protection →
   Vercel Authentication **disable** (warna public site nahi khol sakegi).
2. **Blob storage** — Dashboard → Storage → Create → Blob → project se connect.
3. **Environment variables** — project → Settings → Environment Variables:
   - `BLOB_READ_WRITE_TOKEN` = Blob store ka token (PDFs + CMS content ke liye)
   - `ADMIN_PASSWORD` = admin panel ka password (khud choose karo)
4. **Redeploy** karo.

GitHub par push karte hi Vercel khud redeploy kar deta hai.

## Limits (honest note)

- Vercel functions ~4.5MB se bara response nahi bhej sakte — is liye PDF Blob me
  upload hota hai aur user ko link milta hai.
- Bohat lambi documents (80+ pages) timeout ho sakti hain — un ke liye VPS /
  Render / Railway behtar hai.

## Local dev

```bash
npm install
npx vercel dev
```
