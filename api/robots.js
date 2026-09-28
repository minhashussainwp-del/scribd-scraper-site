// GET /api/robots (rewritten from /robots.txt) — admin-controlled robots.txt
const { loadCMS } = require('./_lib');

module.exports = async (req, res) => {
  const cms = await loadCMS();
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim();
  const text = String(cms.seo.robotsTxt || 'User-agent: *\nAllow: /').replace(/\{\{host\}\}/g, host);
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  return res.status(200).send(text + '\n');
};
