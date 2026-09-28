// GET /api/cms — public site content (homepage, ads, post list, seo flags)
const { loadCMS } = require('./_lib');

module.exports = async (req, res) => {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const cms = await loadCMS();
  return res.status(200).json({
    homepage: cms.homepage,
    ads: cms.ads,
    posts: (cms.posts || []).map((p) => ({
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt,
      date: p.date,
    })),
  });
};
