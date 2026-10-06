import { getSession, configured } from '../lib/auth.js';

export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const session = getSession(req);
  if(!session){
    return res.status(200).json({ admin:false, teacher:false, authed:false, configured: configured() });
  }
  return res.status(200).json({
    admin: session.role==='admin',
    teacher: session.role==='teacher',
    authed: true,
    role: session.role,
    username: session.username || (session.role==='admin' ? 'admin' : ''),
    name: session.name || session.username || '',
    subjects: session.subjects || [],
    configured: configured()
  });
}