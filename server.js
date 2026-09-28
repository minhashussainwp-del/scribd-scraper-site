const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const scrapeScribd = require('scribd-scraper');

const app = express();
const PORT = process.env.PORT || 3000;
const DOWNLOAD_ROOT = path.join(__dirname, 'downloads');
const MAX_CONCURRENT_JOBS = 3;
const JOB_TTL_MS = 60 * 60 * 1000; // 1 hour

if (!fs.existsSync(DOWNLOAD_ROOT)) {
  fs.mkdirSync(DOWNLOAD_ROOT, { recursive: true });
}

app.use(express.json({ limit: '16kb' }));
app.use(express.static(path.join(__dirname, 'public')));

// jobId -> { status: 'processing'|'done'|'error', pdfName, error, createdAt }
const jobs = new Map();

function cleanupOldJobs() {
  const now = Date.now();
  for (const [id, job] of jobs) {
    if (now - job.createdAt > JOB_TTL_MS) {
      fs.rmSync(path.join(DOWNLOAD_ROOT, id), { recursive: true, force: true });
      jobs.delete(id);
    }
  }
}
setInterval(cleanupOldJobs, 15 * 60 * 1000).unref();

function isValidScribdUrl(u) {
  try {
    const parsed = new URL(u.trim());
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
    return parsed.hostname === 'scribd.com' || parsed.hostname.endsWith('.scribd.com');
  } catch {
    return false;
  }
}

app.post('/api/scrape', (req, res) => {
  const { url } = req.body || {};

  if (!url || typeof url !== 'string' || url.length > 500) {
    return res.status(400).json({ error: 'Please paste a Scribd document URL.' });
  }
  if (!isValidScribdUrl(url)) {
    return res.status(400).json({ error: 'Only scribd.com document URLs are supported.' });
  }

  const active = [...jobs.values()].filter((j) => j.status === 'processing').length;
  if (active >= MAX_CONCURRENT_JOBS) {
    return res.status(429).json({ error: 'Server is busy, please try again in a minute.' });
  }

  const jobId = crypto.randomBytes(8).toString('hex');
  const jobDir = path.join(DOWNLOAD_ROOT, jobId);
  fs.mkdirSync(jobDir, { recursive: true });
  jobs.set(jobId, { status: 'processing', createdAt: Date.now() });

  res.json({ jobId });

  // Run the scrape in the background; the browser polls /api/status/:jobId
  (async () => {
    try {
      await scrapeScribd(url.trim(), jobDir, true);
      const pdfs = fs.readdirSync(jobDir).filter((f) => f.endsWith('.pdf'));
      if (pdfs.length === 0) {
        throw new Error('No PDF was produced. The document may be protected, removed, or unavailable.');
      }
      const job = jobs.get(jobId);
      if (job) {
        job.status = 'done';
        job.pdfName = pdfs[0];
      }
    } catch (e) {
      const job = jobs.get(jobId);
      if (job) {
        job.status = 'error';
        job.error = e.message || 'Scraping failed.';
      }
    }
  })();
});

app.get('/api/status/:jobId', (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) return res.status(404).json({ error: 'Job not found or expired.' });
  res.json({
    status: job.status,
    error: job.error || null,
    downloadUrl: job.status === 'done' ? `/api/download/${req.params.jobId}` : null,
  });
});

app.get('/api/download/:jobId', (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job || job.status !== 'done' || !job.pdfName) {
    return res.status(404).send('File not ready or expired.');
  }
  res.download(path.join(DOWNLOAD_ROOT, req.params.jobId, job.pdfName), job.pdfName);
});

app.listen(PORT, () => {
  console.log(`scribd-scraper-site listening on http://localhost:${PORT}`);
});
