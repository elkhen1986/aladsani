import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { checkPassword, makeAdminToken, makeTeacherToken, cookieHeader, configured, readJson, checkHash } from '../lib/auth.js';

function getR2(){
  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });
}
const BUCKET = process.env.R2_BUCKET_NAME;
const TEACHERS_KEY = 'data/teachers.json';

async function streamToString(stream){
  const chunks=[]; for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf-8');
}

async function loadTeachers(){
  try{
    const R2=getR2();
    const data=await R2.send(new GetObjectCommand({Bucket: BUCKET, Key: TEACHERS_KEY}));
    const text=await streamToString(data.Body);
    const json=JSON.parse(text);
    return json.teachers || json || [];
  }catch(e){ return []; }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  if (!configured()) return res.status(500).json({ error: 'not_configured' });

  const body = readJson(req);
  const { username, password } = body;
  const u = String(username||'').trim().toLowerCase();
  const p = String(password||'');

  if (!p) {
    await new Promise((r) => setTimeout(r, 800));
    return res.status(401).json({ error: 'bad_password' });
  }

  // 1- أدمن: username = admin + باسورد ADMIN_PASSWORD (نفس ملفك القديم)
  if((!u || u==='admin') && checkPassword(p)){
    res.setHeader('Set-Cookie', cookieHeader(makeAdminToken(), req));
    return res.status(200).json({ ok: true, role: 'admin' });
  }

  // 2- معلم: username + password من R2/data/teachers.json
  try{
    const teachers=await loadTeachers();
    const teacher=teachers.find(t=> String(t.username||'').toLowerCase()===u);
    if(!teacher) {
      await new Promise(r=>setTimeout(r,800));
      return res.status(401).json({ error: 'bad_credentials' });
    }
    let ok=false;
    if(teacher.passwordHash){
      ok=checkHash(p, teacher.passwordHash);
    } else if(teacher.password){
      ok=teacher.password===p;
    }
    if(!ok){
      await new Promise(r=>setTimeout(r,800));
      return res.status(401).json({ error: 'bad_credentials' });
    }

    const token=makeTeacherToken({
      username: teacher.username,
      subjects: teacher.subjects || [],
      name: teacher.name || teacher.username
    });
    res.setHeader('Set-Cookie', cookieHeader(token, req));
    return res.status(200).json({ ok: true, role: 'teacher', username: teacher.username, subjects: teacher.subjects, name: teacher.name });
  }catch(e){
    console.error('teacher login error', e);
    return res.status(500).json({ error: 'server_error' });
  }
}