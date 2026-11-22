// POST /api/mouza-map-browse -> https://eporcha.tech/api/mouza-map/browse
// Body: {parentId} or {path} — Google Drive folders. Division roots are in index.html.
async function readBody(req) {
  if (req.body) return typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const t = Buffer.concat(chunks).toString('utf8');
  return t ? JSON.parse(t) : {};
}
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });
  try {
    const body = await readBody(req);
    const r = await fetch('https://eporcha.tech/api/mouza-map/browse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0 ePorcha-Vercel-Proxy' },
      body: JSON.stringify(body),
    });
    const text = await r.text();
    res.status(r.status);
    try { return res.json(JSON.parse(text)); }
    catch { res.setHeader('Content-Type', 'application/json'); return res.send(text); }
  } catch (e) {
    return res.status(502).json({ success: false, message: 'Upstream API failed: ' + e.message });
  }
};
