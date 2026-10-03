import { checkPassword, makeToken, cookieHeader, configured, readJson } from '../lib/auth.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  if (!configured()) return res.status(500).json({ error: 'not_configured' });
  const { password } = readJson(req);
  if (!checkPassword(password || '')) {
    await new Promise((r) => setTimeout(r, 800)); // إبطاء محاولات التخمين
    return res.status(401).json({ error: 'bad_password' });
  }
  res.setHeader('Set-Cookie', cookieHeader(makeToken(), req));
  return res.status(200).json({ ok: true });
}
