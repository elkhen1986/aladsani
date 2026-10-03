import { del } from '@vercel/blob';
import { isAdmin, readJson } from '../lib/auth.js';
import { isOurBlobUrl } from '../lib/files.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  if (!isAdmin(req)) return res.status(401).json({ error: 'unauthorized' });
  const { url } = readJson(req);
  if (!isOurBlobUrl(url)) return res.status(400).json({ error: 'bad_url' });
  try { await del(url); return res.status(200).json({ ok: true }); }
  catch { return res.status(500).json({ error: 'delete_failed' }); }
}
