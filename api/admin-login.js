// POST /api/admin-login { password } — sets a signed HttpOnly session cookie
const { sessionToken } = require('./_lib');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return res.status(500).json({ error: 'ADMIN_PASSWORD is not configured in Vercel.' });
  const { password } = req.body || {};
  if (password !== pw) return res.status(401).json({ error: 'Wrong password.' });

  const proto = (req.headers['x-forwarded-proto'] || 'http').split(',')[0].trim();
  const secure = proto === 'https' ? '; Secure' : '';
  res.setHeader(
    'Set-Cookie',
    `admin_auth=${sessionToken(pw)}; HttpOnly; Path=/; Max-Age=2592000; SameSite=Lax${secure}`
  );
  return res.status(200).json({ ok: true });
};
