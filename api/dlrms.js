// Vercel serverless proxy: GET /api/dlrms?path=divisions&ROW_STATUS=1
// Frontend calls SAME-ORIGIN /api/dlrms, so the browser never hits
// eporcha.tech directly (that API sends no CORS headers).
// Upstream: https://eporcha.tech/api/dlrms/<path>
const UPSTREAM = 'https://eporcha.tech/api/dlrms';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed' });

  try {
    const url = new URL(req.url, 'http://localhost');
    const path = (url.searchParams.get('path') || '').replace(/^\/+/, '');
    if (!path) return res.status(400).json({ success: false, message: 'path param missing, e.g. ?path=divisions' });
    const params = new URLSearchParams(url.search);
    params.delete('path');
    if (!params.has('ROW_STATUS')) params.set('ROW_STATUS', '1');
    const upstream = `${UPSTREAM}/${path}?${params.toString()}`;
    const r = await fetch(upstream, {
      headers: { 'User-Agent': 'Mozilla/5.0 ePorcha-Vercel-Proxy', Accept: 'application/json' },
    });
    const text = await r.text();
    res.setHeader('Cache-Control', 'public, max-age=60');
    res.status(r.status);
    try { return res.json(JSON.parse(text)); }
    catch { res.setHeader('Content-Type', 'application/json'); return res.send(text); }
  } catch (e) {
    return res.status(502).json({ success: false, message: 'Upstream API failed: ' + e.message });
  }
};
