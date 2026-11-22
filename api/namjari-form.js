// POST /api/namjari-form -> https://eporcha.tech/api/namjari-khatian/form
// Body: {division,survey,district,upazila,mouza,jlNo,jlNumberId,khatianNo,owners,guardians,dags,totalLand}
// Upstream returns printable HTML — forwarded as-is.
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
    const r = await fetch('https://eporcha.tech/api/namjari-khatian/form', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0 ePorcha-Vercel-Proxy' },
      body: JSON.stringify(body),
    });
    const text = await r.text();
    res.status(r.status);
    res.setHeader('Content-Type', r.headers.get('content-type') || 'text/html; charset=utf-8');
    return res.send(text);
  } catch (e) {
    return res.status(502).json({ success: false, message: 'Upstream API failed: ' + e.message });
  }
};
