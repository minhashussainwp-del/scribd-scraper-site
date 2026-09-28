const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const scrapeScribd = require('scribd-scraper');
const { put } = require('@vercel/blob');

function isValidScribdUrl(u) {
  try {
    const parsed = new URL(u.trim());
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
    return parsed.hostname === 'scribd.com' || parsed.hostname.endsWith('.scribd.com');
  } catch {
    return false;
  }
}

// Vercel serverless function:
// 1. scrapes the Scribd document to /tmp
// 2. uploads the PDF to Vercel Blob (functions can't return >4.5MB responses)
// 3. returns a public download URL as JSON
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.body || {};

  if (!url || typeof url !== 'string' || url.length > 500) {
    return res.status(400).json({ error: 'Please provide a Scribd document URL.' });
  }
  if (!isValidScribdUrl(url)) {
    return res.status(400).json({ error: 'Only scribd.com document URLs are supported.' });
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return res.status(500).json({
      error: 'Storage is not configured. Add the BLOB_READ_WRITE_TOKEN environment variable in the Vercel project settings and redeploy.',
    });
  }

  const jobDir = path.join(os.tmpdir(), 'scrape-' + crypto.randomBytes(8).toString('hex'));
  fs.mkdirSync(jobDir, { recursive: true });

  try {
    await scrapeScribd(url.trim(), jobDir, true);

    const pdfs = fs.readdirSync(jobDir).filter((f) => f.endsWith('.pdf'));
    if (pdfs.length === 0) {
      return res.status(500).json({
        error: 'No PDF was produced. The document may be protected, removed, or unavailable.',
      });
    }

    const pdfPath = path.join(jobDir, pdfs[0]);
    const pdfBuffer = fs.readFileSync(pdfPath);

    const blob = await put('scribd-pdfs/' + pdfs[0], pdfBuffer, {
      access: 'public',
      token,
      contentType: 'application/pdf',
      addRandomSuffix: false,
    });

    return res.status(200).json({
      downloadUrl: blob.url,
      filename: pdfs[0],
      size: pdfBuffer.length,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Scraping failed.' });
  } finally {
    fs.rmSync(jobDir, { recursive: true, force: true });
  }
};
