// POST /api/namjari-pdf -> https://eporcha.tech/api/namjari-khatian/pdf
// Body: {division,survey,district,upazila,mouza,jlNo,jlNumberId,khatianNo,owners,guardians,dags,totalLand}
// Upstream returns a REAL PDF (binary). Forward it as binary with a download filename.
// If upstream returns 502 (it sometimes does on back-to-back calls), retry once after 5s.
async function readBody(req) {
  if (req.body) return typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const t = Buffer.concat(chunks).toString('utf8');
  return t ? JSON.parse(t) : {};
}
async function callUpstream(body) {
  return fetch('https://eporcha.tech/api/namjari-khatian/pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0 ePorcha-Vercel-Proxy' },
    body: JSON.stringify(body),
  });
}
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });
  try {
    const body = await readBody(req);
    let r = await callUpstream(body);
    if (!r.ok && (r.status === 502 || r.status === 503)) {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      r = await callUpstream(body);
    }
    if (!r.ok) {
      const text = await r.text().catch(() => '');
      return res.status(r.status).json({ success: false, message: 'PDF তৈরি করা যায়নি (upstream ' + r.status + ')', detail: text.slice(0, 300) });
    }
    const buf = Buffer.from(await r.arrayBuffer());
    const survey = String(body.survey || 'khatian').toLowerCase().replace(/[^a-z0-9]+/g, '');
    const fileName = `khatian-${survey}-JL${body.jlNo || ''}-No${body.khatianNo || ''}.pdf`.replace(/-+/g, '-');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', buf.length);
    return res.status(200).send(buf);
  } catch (e) {
    return res.status(502).json({ success: false, message: 'Upstream API failed: ' + e.message });
  }
};
