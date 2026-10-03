// جلسة المشرف: كلمة سر واحدة (ADMIN_PASSWORD) + كوكي موقّع (SESSION_SECRET). لا قاعدة بيانات.
import crypto from 'node:crypto';

export const COOKIE = 'adsani_admin';
export const MAX_AGE = 60 * 60 * 24 * 7; // 7 أيام

export const configured = () =>
  !!process.env.ADMIN_PASSWORD && (process.env.SESSION_SECRET || '').length >= 16;

const sign = (payload) =>
  crypto.createHmac('sha256', process.env.SESSION_SECRET).update(payload).digest('base64url');

const sha = (s) => crypto.createHash('sha256').update(String(s)).digest();

export function checkPassword(input) {
  if (!configured()) return false;
  return crypto.timingSafeEqual(sha(input), sha(process.env.ADMIN_PASSWORD));
}

export function makeToken() {
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + MAX_AGE * 1000 })).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

export function verifyToken(token) {
  if (!token || !configured()) return false;
  const [payload, sig] = String(token).split('.');
  if (!payload || !sig) return false;
  const a = Buffer.from(sig), b = Buffer.from(sign(payload));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  try { return JSON.parse(Buffer.from(payload, 'base64url').toString()).exp > Date.now(); }
  catch { return false; }
}

export function getCookie(req, name) {
  for (const part of String(req.headers?.cookie || '').split(';')) {
    const i = part.indexOf('=');
    if (i > -1 && part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return '';
}

export const isAdmin = (req) => verifyToken(getCookie(req, COOKIE));

export function cookieHeader(token, req, maxAge = MAX_AGE) {
  const https = String(req.headers?.['x-forwarded-proto'] || '').includes('https');
  return `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${https ? '; Secure' : ''}`;
}

export function readJson(req) {
  const b = req.body;
  if (b && typeof b === 'object') return b;
  try { return JSON.parse(b || '{}'); } catch { return {}; }
}
