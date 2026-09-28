// GET /api/post/:slug (rewritten from /blog/:slug) — server-rendered blog post page
const { loadCMS, esc } = require('../_lib');

function adHtml(cms, slot) {
  if (!cms.ads || cms.ads.enabled === false) return '';
  const p = (cms.ads.placements || {})[slot];
  if (!p || !p.enabled || !p.code) return '';
  return `<div class="ad-slot" data-ad="${esc(slot)}">${p.code}</div>`;
}

module.exports = async (req, res) => {
  const slug = String((req.query && req.query.slug) || '').toLowerCase();
  const cms = await loadCMS();
  const post = (cms.posts || []).find((p) => String(p.slug).toLowerCase() === slug);

  if (!post) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(404).send(
      '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Not found</title></head>' +
        '<body style="font-family:sans-serif;background:#0f172a;color:#e2e8f0;text-align:center;padding:80px 20px">' +
        '<h1>Post not found</h1><p><a href="/" style="color:#38bdf8">Back to home</a></p></body></html>'
    );
  }

  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim();
  const canonical = `https://${host}/blog/${encodeURIComponent(post.slug)}`;
  const others = (cms.posts || []).filter((p) => p.slug !== post.slug).slice(0, 3);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(post.title)} — Scribd Downloader</title>
<meta name="description" content="${esc(post.excerpt || post.title)}">
<link rel="canonical" href="${canonical}">
<meta property="og:title" content="${esc(post.title)}">
<meta property="og:description" content="${esc(post.excerpt || post.title)}">
<meta property="og:type" content="article">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#0f172a;color:#e2e8f0;line-height:1.7}
.wrap{max-width:760px;margin:0 auto;padding:32px 20px}
nav{display:flex;justify-content:space-between;align-items:center;max-width:1100px;margin:0 auto;padding:18px 20px}
nav a.logo{font-weight:800;font-size:1.2rem;color:#e2e8f0;text-decoration:none}
nav a.logo span{color:#38bdf8}
nav .links a{color:#94a3b8;text-decoration:none;margin-left:20px;font-size:.95rem}
nav .links a:hover{color:#e2e8f0}
.ad-slot{margin:24px auto;text-align:center;max-width:1100px;overflow:hidden}
article{background:#1e293b;border:1px solid #334155;border-radius:14px;padding:36px}
article h1{font-size:1.9rem;margin-bottom:8px;line-height:1.3}
.meta{color:#64748b;font-size:.85rem;margin-bottom:24px}
.prose p{margin:0 0 16px;color:#cbd5e1}
.prose ul,.prose ol{margin:0 0 16px 22px;color:#cbd5e1}
.prose li{margin-bottom:8px}
.prose a{color:#38bdf8}
.related{margin-top:36px}
.related h3{margin-bottom:14px}
.related a{display:block;background:#1e293b;border:1px solid #334155;border-radius:10px;padding:14px 18px;margin-bottom:10px;color:#e2e8f0;text-decoration:none}
.related a:hover{border-color:#38bdf8}
.related small{color:#64748b}
footer{text-align:center;color:#64748b;font-size:.85rem;padding:40px 20px}
footer a{color:#94a3b8;text-decoration:none;margin:0 10px}
</style>
</head>
<body>
<nav><a class="logo" href="/">Scribd <span>Downloader</span></a><div class="links"><a href="/">Home</a><a href="/#blog">Blog</a><a href="/#faq">FAQ</a></div></nav>
${adHtml(cms, 'blogTop')}
<div class="wrap">
<article>
<h1>${esc(post.title)}</h1>
<div class="meta">${esc(post.date || '')}</div>
<div class="prose">${post.content || ''}</div>
</article>
${adHtml(cms, 'blogBottom')}
${others.length ? `<div class="related"><h3>More articles</h3>` + others.map(o => `<a href="/blog/${encodeURIComponent(o.slug)}"><strong>${esc(o.title)}</strong><br><small>${esc(o.excerpt || '')}</small></a>`).join('') + `</div>` : ''}
</div>
<footer><a href="/">Home</a><a href="/sitemap.xml">Sitemap</a><a href="/robots.txt">Robots</a><br><br>© 2026 Scribd Downloader</footer>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(200).send(html);
};
