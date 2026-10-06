import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { isAdmin, hashPassword } from '../lib/auth.js';

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
    return { teachers: json.teachers || json || [], raw: json };
  }catch(e){ return { teachers: [], raw: null }; }
}

export default async function handler(req, res){
  res.setHeader('Cache-Control','no-store');
  if(!isAdmin(req)) return res.status(403).json({error:'forbidden - admin only'});

  const R2=getR2();

  if(req.method==='GET'){
    const { teachers } = await loadTeachers();
    // لا ترجع الهاش
    const safe = teachers.map(t=>({
      id: t.id,
      username: t.username,
      name: t.name,
      subjects: t.subjects||[],
      createdAt: t.createdAt
    }));
    return res.status(200).json({ teachers: safe });
  }

  if(req.method==='POST'){
    try{
      const body = typeof req.body==='string'? JSON.parse(req.body) : req.body;
      const { action, teacher } = body;

      let { teachers } = await loadTeachers();

      if(action==='create'){
        const { username, password, name, subjects } = teacher||{};
        if(!username ||!password) return res.status(400).json({error:'username and password required'});
        const u=String(username).trim().toLowerCase();
        if(teachers.find(t=>t.username===u)) return res.status(400).json({error:'username exists'});
        const newTeacher={
          id: Date.now().toString(36)+Math.random().toString(36).slice(2,6),
          username: u,
          passwordHash: hashPassword(password),
          name: String(name||'').trim() || u,
          subjects: Array.isArray(subjects)? subjects : [],
          createdAt: new Date().toISOString()
        };
        teachers.push(newTeacher);
      }else if(action==='update'){
        const { id, username, password, name, subjects } = teacher||{};
        if(!id) return res.status(400).json({error:'id required'});
        const idx=teachers.findIndex(t=>t.id===id);
        if(idx===-1) return res.status(404).json({error:'not found'});
        if(username) teachers[idx].username=String(username).trim().toLowerCase();
        if(name) teachers[idx].name=String(name).trim();
        if(Array.isArray(subjects)) teachers[idx].subjects=subjects;
        if(password) teachers[idx].passwordHash=hashPassword(password);
      }else if(action==='delete'){
        const { id } = teacher||{};
        if(!id) return res.status(400).json({error:'id required'});
        teachers=teachers.filter(t=>t.id!==id);
      }else{
        return res.status(400).json({error:'invalid action'});
      }

      await R2.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: TEACHERS_KEY,
        Body: JSON.stringify({ teachers }, null, 2),
        ContentType: 'application/json; charset=utf-8'
      }));

      return res.status(200).json({ok:true});
    }catch(e){
      console.error('teachers POST error', e);
      return res.status(500).json({error:e.message});
    }
  }

  return res.status(405).json({error:'method not allowed'});
}