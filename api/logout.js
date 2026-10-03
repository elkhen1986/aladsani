import { cookieHeader } from '../lib/auth.js';

export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  res.setHeader('Set-Cookie', cookieHeader('', req, 0));
  return res.status(200).json({ ok: true });
}
