# scribd-scraper-site (Vercel-ready)

Web app built on the [`scribd-scraper`](https://www.npmjs.com/package/scribd-scraper) npm package (v1.0.5).
Paste a Scribd document URL, get a PDF back. Free, no signup.

## Deploy to Vercel (2 tareeqe)

**Tareeqa 1 — Vercel CLI (sab se fast):**
```bash
cd scribd-scraper-site-vercel
npx vercel
```
Pehli baar Vercel account se login karna parega, phir har deploy par sirf `npx vercel --prod`.

**Tareeqa 2 — GitHub se:**
1. Is folder ko GitHub repo me push karo.
2. Vercel dashboard → Add New Project → repo select karo → Deploy.
3. Koi env variable ya setting change karne ki zaroorat nahi.

## Kaise kaam karta hai (Vercel version)

- `public/index.html` — frontend: URL form, spinner, PDF auto-download.
- `api/scrape.js` — serverless function: ek hi request me document scrape karke PDF wapas bhejta hai.
- `vercel.json` — function timeout 60 second tak set hai.
- `server.js` — purana Express version, sirf local testing ke liye. Vercel isay ignore karta hai.

## Important limit (honest note)

Vercel ka serverless function ek request me max **60 second** chalta hai (`maxDuration`).
Chhoti documents (jaise 1–20 pages) aaram se ho jati hain. Bohat lambi documents
(jaise 80 pages wali, jisme ~80 second lage thay) **timeout** ho sakti hain —
un ke liye yehi code kisi VPS (ya Render/Railway) par `node server.js` se chalao,
wahan koi time limit nahi.

## Local test

```bash
npm install
npm start        # Express version, http://localhost:3000
# ya
npx vercel dev   # Vercel version locally
```
