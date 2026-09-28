// POST /api/admin-save { section, data } — auth required.
// section: 'homepage' | 'posts' | 'ads' | 'seo'
const { loadCMS, saveCMS, isAuthed } = require('./_lib');

const SECTIONS = ['homepage', 'posts', 'ads', 'seo'];

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!isAuthed(req)) return res.status(401).json({ error: 'Not logged in.' });

  const { section, data } = req.body || {};
  if (!SECTIONS.includes(section)) return res.status(400).json({ error: 'Unknown section.' });

  // light validation per section
  if (section === 'posts') {
    if (!Array.isArray(data)) return res.status(400).json({ error: 'posts must be an array.' });
    for (const p of data) {
      if (!p.slug || !p.title) return res.status(400).json({ error: 'Each post needs a slug and a title.' });
      p.slug = String(p.slug).toLowerCase().replace(/[^a-z0-9-]/g, '-');
    }
  }

  const cms = await loadCMS();
  cms[section] = data;
  try {
    await saveCMS(cms);
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Save failed.' });
  }
  return res.status(200).json({ ok: true });
};
