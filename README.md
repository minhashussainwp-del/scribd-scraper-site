# scribd-scraper-site (Vercel-ready)

Web app built on the [`scribd-scraper`](https://www.npmjs.com/package/scribd-scraper) npm package (v1.0.5).
Paste a Scribd document URL, get a PDF back. Free, no signup.

## How it works

- `public/index.html` — frontend: URL form, spinner, download link.
- `api/scrape.js` — serverless function: scrapes the document, uploads the PDF to
  **Vercel Blob**, and returns a public download URL as JSON.
  (Vercel functions can't return responses bigger than ~4.5MB, so the PDF goes to
  Blob storage instead of being sent directly.)
- `vercel.json` — function timeout 300 seconds (Vercel Hobby max with Fluid Compute).
- `server.js` — old Express version, local testing only. Vercel ignores it.

## Vercel setup (one-time, dashboard me)

**1. Deployment Protection OFF karo** (warna public site nahi khol sakegi):
Vercel Dashboard → project → **Settings → Deployment Protection** → Vercel Authentication **disable** karo.

**2. Blob storage lagao** (PDFs ke liye):
1. Vercel Dashboard → **Storage** tab → **Create** → **Blob** → naam do → Create.
2. Us store ko `scribd-scraper-site` project se connect karo (ya token copy karo).
3. Project → **Settings → Environment Variables** → nayi variable:
   - Name: `BLOB_READ_WRITE_TOKEN`
   - Value: Blob store ka token
4. **Redeploy** karo (Deployments → ... → Redeploy).

Is ke baad har scrape ka PDF Blob me upload hoga aur user ko direct download link milega.

## Deploy

GitHub repo se: Vercel Dashboard → Add New Project → repo select → Deploy.
GitHub par push karte hi Vercel khud redeploy kar deta hai.

## Limits (honest note)

- Bohat lambi documents (80+ pages) function timeout (300s) me aa sakti hain.
- Aisi documents ke liye yehi code kisi VPS / Render / Railway par `node server.js`
  se chalao — wahan koi time ya size limit nahi.

## Local test

```bash
npm install
npm start        # Express version, http://localhost:3000
# ya
npx vercel dev   # Vercel version locally
```
