// GET /api/sitemap (rewritten from /sitemap.xml) — dynamic XML sitemap
const { loadCMS } = require('./_lib');

function hostOf(req) {
  const h = req.headers['x-forwarded-host'] || req.headers.host || '';
  return String(h).split(',')[0].trim();
}

module.exports = async (req, res) => {
  const cms = await loadCMS();
  const host = hostOf(req);
  const base = `https://${host}`;
  const urls = [];

  if (cms.seo.sitemapHomepage !== false) {
    urls.push({ loc: base + '/', changefreq: 'daily', priority: '1.0' });
  }
  if (cms.seo.sitemapBlog !== false) {
    for (const p of cms.posts || []) {
      urls.push({
        loc: `${base}/blog/${encodeURIComponent(p.slug)}`,
        lastmod: p.date || undefined,
        changefreq: 'weekly',
        priority: '0.8',
      });
    }
  }
  const extra = String(cms.seo.sitemapExtraUrls || '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
  for (const u of extra) {
    urls.push({ loc: u.startsWith('http') ? u : base + (u.startsWith('/') ? u : '/' + u), changefreq: 'monthly', priority: '0.5' });
  }

  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls
      .map(
        (u) =>
          '  <url>\n' +
          `    <loc>${u.loc.replace(/&/g, '&amp;')}</loc>\n` +
          (u.lastmod ? `    <lastmod>${u.lastmod}</lastmod>\n` : '') +
          `    <changefreq>${u.changefreq}</changefreq>\n` +
          `    <priority>${u.priority}</priority>\n` +
          '  </url>'
      )
      .join('\n') +
    '\n</urlset>';

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  return res.status(200).send(xml);
};
