// Shared helpers for the CMS-backed site (Vercel serverless).
// Content lives in Vercel Blob as JSON (cms/site.json) so the admin panel
// can edit it without redeploys. Files starting with _ are not routed by Vercel.
const crypto = require('crypto');
const { put, head } = require('@vercel/blob');

const CMS_PATH = 'cms/site.json';

const AD_SLOTS = [
  ['header', 'Header banner (below navigation)'],
  ['belowHero', 'Below hero section'],
  ['aboveButton', 'Above download button'],
  ['belowButton', 'Below download button'],
  ['inContent', 'In-content (between sections)'],
  ['aboveFooter', 'Above footer'],
  ['blogTop', 'Blog post top'],
  ['blogBottom', 'Blog post bottom'],
];

function defaultAds() {
  const placements = {};
  for (const [key] of AD_SLOTS) placements[key] = { enabled: false, code: '' };
  return { enabled: true, placements };
}

function defaultCMS() {
  return {
    homepage: {
      heroTitle: 'Download Scribd Documents as PDF',
      heroSubtitle:
        'Paste any public Scribd link and get a clean, full-page PDF in seconds. No signup, no watermark, free.',
      features: [
        { title: 'Full pages', desc: 'Every page of the document, captured at full quality and merged into one PDF.' },
        { title: 'No signup', desc: 'No account, no email, no extensions. Paste the link and download.' },
        { title: 'Fast', desc: 'Pages are fetched in parallel and assembled into a PDF automatically.' },
        { title: 'Free', desc: 'No paywalls or download limits on public documents.' },
        { title: 'Mobile friendly', desc: 'Works on phones, tablets and desktops right from the browser.' },
        { title: 'Private', desc: 'Your links are processed on demand and temporary files are deleted afterwards.' },
      ],
      steps: [
        { title: 'Copy the link', desc: 'Open the Scribd document and copy its URL from the address bar.' },
        { title: 'Paste it above', desc: 'Paste the link into the box and hit Download.' },
        { title: 'Get your PDF', desc: 'Preview the pages, then download the finished PDF.' },
      ],
      faqs: [
        { q: 'Which documents work?', a: 'Publicly accessible Scribd documents. If a document is private, removed or protected, it cannot be processed.' },
        { q: 'Is there a page limit?', a: 'Very long documents take longer. If a document is extremely long the request may time out — try again or use a shorter document.' },
        { q: 'Do I need an account?', a: 'No. There is no signup and nothing to install.' },
        { q: 'Is it free?', a: 'Yes, downloading public documents is free.' },
        { q: 'Where does my PDF go?', a: 'The generated PDF is stored briefly for your download link and temporary working files are deleted afterwards.' },
      ],
    },
    posts: [
      {
        slug: 'how-to-download-scribd-document-as-pdf',
        title: 'How to Download a Scribd Document as a PDF',
        excerpt: 'A quick step-by-step guide to turning any public Scribd document into a PDF you can keep.',
        date: '2026-09-29',
        content:
          '<p>Need a Scribd document as a PDF? It takes less than a minute:</p><ol><li>Open the document on Scribd and copy the page URL.</li><li>Paste it into the downloader box on our homepage.</li><li>Wait while the pages are fetched and assembled.</li><li>Preview the pages and download your PDF.</li></ol><p>Only publicly accessible documents can be processed — private or removed documents will not work.</p>',
      },
      {
        slug: 'scribd-download-not-working',
        title: 'Scribd Download Not Working? Here Is What to Check',
        excerpt: 'If your download fails, run through this quick checklist before trying again.',
        date: '2026-09-29',
        content:
          '<p>Downloads usually fail for one of these reasons:</p><ul><li><strong>Private or removed document</strong> — only public documents work.</li><li><strong>Wrong link</strong> — use the full document URL, e.g. scribd.com/document/12345/title.</li><li><strong>Very long document</strong> — extremely long documents can time out; try again later.</li><li><strong>Temporary hiccup</strong> — wait a minute and retry.</li></ul>',
      },
      {
        slug: 'read-scribd-pdf-on-kindle-mobile',
        title: 'How to Read Your Scribd PDF on Kindle and Mobile',
        excerpt: 'Once you have the PDF, here is how to get it onto your e-reader or phone.',
        date: '2026-09-29',
        content:
          '<p>After downloading your PDF:</p><ul><li><strong>Kindle:</strong> email the PDF to your Kindle address or use the Send to Kindle app.</li><li><strong>Phone/tablet:</strong> open it in any PDF reader, or save it to Google Drive / iCloud.</li><li><strong>Desktop:</strong> any modern browser opens PDFs directly.</li></ul>',
      },
    ],
    ads: defaultAds(),
    seo: {
      robotsTxt: 'User-agent: *\nAllow: /\n\nSitemap: https://{{host}}/sitemap.xml',
      sitemapHomepage: true,
      sitemapBlog: true,
      sitemapExtraUrls: '',
    },
  };
}

async function loadCMS() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return defaultCMS();
  try {
    const meta = await head(CMS_PATH, { token });
    const r = await fetch(meta.url, { cache: 'no-store' });
    if (!r.ok) throw new Error('fetch failed');
    const data = await r.json();
    // merge over defaults so new fields always exist
    const d = defaultCMS();
    return {
      homepage: { ...d.homepage, ...(data.homepage || {}) },
      posts: Array.isArray(data.posts) ? data.posts : d.posts,
      ads: {
        enabled: data.ads && data.ads.enabled !== false,
        placements: { ...d.ads.placements, ...((data.ads || {}).placements || {}) },
      },
      seo: { ...d.seo, ...(data.seo || {}) },
    };
  } catch {
    return defaultCMS();
  }
}

async function saveCMS(data) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) throw new Error('BLOB_READ_WRITE_TOKEN is not configured');
  await put(CMS_PATH, JSON.stringify(data), {
    access: 'public',
    token,
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

function parseCookies(header) {
  const out = {};
  for (const part of String(header || '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

function sessionToken(password) {
  return crypto.createHmac('sha256', String(password)).update('admin-session').digest('hex');
}

function isAuthed(req) {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return false;
  const token = parseCookies(req.headers && req.headers.cookie).admin_auth;
  if (!token || token.length !== 64) return false;
  const expected = sessionToken(pw);
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

module.exports = { loadCMS, saveCMS, isAuthed, sessionToken, parseCookies, esc, AD_SLOTS, CMS_PATH };
