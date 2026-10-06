import { isAdmin, configured } from '../lib/auth.js';

export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({ admin: isAdmin(req), configured: configured() });
}
