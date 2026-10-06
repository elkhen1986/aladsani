// جلسة المشرف والمعلمين: أدمن + معلمين بصلاحيات مادة
// مبني على ملفك القديم - نفس ADMIN_PASSWORD + SESSION_SECRET
import crypto from 'node:crypto';

export const COOKIE = 'adsani_admin';
export const MAX_AGE = 60 * 60 * 24 * 7; // 7 أيام

export const configured = () =>
  !!process.env.ADMIN_PASSWORD && (process.env.SESSION_SECRET || '').length >= 16;

const sign = (payload) =>
  crypto.createHmac('sha256', process.env.SESSION_SECRET).update(payload).digest('base64url');

const sha = (s) => crypto.createHash('sha256').update(String(s)).digest();
const shaHex = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');

export function checkPassword(input) {
  if (!configured()) return false;
  try {
    return crypto.timingSafeEqual(sha(input), sha(process.env.ADMIN_PASSWORD));
  } catch { return false; }
}

export function hashPassword(input) {
  return shaHex(input);
}

export function checkHash(input, hash) {
  if (!hash) return false;
  try {
    return crypto.timingSafeEqual(sha(input), Buffer.from(hash, 'hex'));
  } catch { 
    return shaHex(input) === hash;
  }
}

export function makeToken(payloadExtra = {}) {
  const payload = {
    role: 'admin',
    exp: Date.now() + MAX_AGE * 1000,
    ...payloadExtra
  };
  const json = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${json}.${sign(json)}`;
}

export function makeAdminToken() {
  return makeToken({ role: 'admin' });
}

export function makeTeacherToken({ username, subjects = [], name = '' }) {
  return makeToken({ role: 'teacher', username, subjects, name });
}

export function verifyToken(token) {
  if (!token || !configured()) return null;
  const parts = String(token).split('.');
  if (parts.length !== 2) return null;
  const [payloadB64, sig] = parts;
  if (!payloadB64 || !sig) return null;
  try {
    const a = Buffer.from(sig), b = Buffer.from(sign(payloadB64));
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
    if (!payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch { return null; }
}

export function getCookie(req, name) {
  for (const part of String(req.headers?.cookie || '').split(';')) {
    const i = part.indexOf('=');
    if (i > -1 && part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return '';
}

export function getSession(req) {
  const token = getCookie(req, COOKIE);
  return verifyToken(token);
}

export const isAdmin = (req) => {
  const s = getSession(req);
  return !!(s && s.role === 'admin');
};

export const isTeacher = (req) => {
  const s = getSession(req);
  return !!(s && s.role === 'teacher');
};

export const isAuthed = (req) => {
  const s = getSession(req);
  return !!(s && (s.role === 'admin' || s.role === 'teacher'));
};

export function canEditSubject(req, subjectId) {
  const s = getSession(req);
  if (!s) return false;
  if (s.role === 'admin') return true;
  if (s.role === 'teacher') {
    if (!subjectId) return false;
    const subs = s.subjects || [];
    return subs.includes(subjectId) || subs.includes('*') || subs.includes('all');
  }
  return false;
}

export function canUploadToSubject(req, subjectId) {
  return canEditSubject(req, subjectId);
}

export function cookieHeader(token, req, maxAge = MAX_AGE) {
  const https = String(req.headers?.['x-forwarded-proto'] || '').includes('https') || String(req.headers?.host || '').includes('vercel.app');
  return `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${https ? '; Secure' : ''}`;
}

export function readJson(req) {
  const b = req.body;
  if (b && typeof b === 'object' && !Buffer.isBuffer(b)) return b;
  try { return JSON.parse(b || '{}'); } catch { return {}; }
}