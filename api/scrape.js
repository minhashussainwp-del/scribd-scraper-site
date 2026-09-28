const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const scrapeScribd = require('scribd-scraper');

function isValidScribdUrl(u) {
  try {
    const parsed = new URL(u.trim());
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
    return parsed.hostname === 'scribd.com' || parsed.hostname.endsWith('.scribd.com');
  } catch {
    return false;
  }
}

// Vercel serverless function: scrapes the document and returns the PDF directly.
// Note: one invocation = one scrape, so very long documents are limited by
// the function's maxDuration (see vercel.json).
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

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="' + pdfs[0] + '"');
    res.setHeader('Content-Length', pdfBuffer.length);
    return res.status(200).send(pdfBuffer);
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Scraping failed.' });
  } finally {
    fs.rmSync(jobDir, { recursive: true, force: true });
  }
};
