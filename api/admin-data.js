import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSession } from '../lib/auth.js';

async function streamToString(stream) {
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf-8');
}

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

export default async function handler(req, res){
  const { type } = req.query;
  const keyMap = {
    subjects: 'data/subjects.json',
    tabs: 'data/tabs.json',
    orders: 'data/files-order.json'
  };
  const key = keyMap[type] || keyMap.subjects;

  if(req.method === 'GET'){
    try{
      const R2 = getR2();
      const data = await R2.send(new GetObjectCommand({Bucket: BUCKET, Key: key}));
      const txt = await streamToString(data.Body);
      return res.status(200).json(JSON.parse(txt));
    }catch(e){
      if(type==='orders') return res.status(200).json({});
      if(type==='tabs') return res.status(200).json({subjectTabs:{}, gradeSubjectTabs:{}});
      return res.status(200).json({subjects:{}, gradeSubjects:{}, covers:{}});
    }
  }

  if(req.method === 'POST'){
    // 🔒 أدمن فقط - المعلم يضيف ويمسح ملفات بس من upload-r2 و delete
    const session = getSession(req);
    if(!session || session.role!=='admin'){
      return res.status(403).json({error:'forbidden - admin only'});
    }

    try{
      let body = req.body;
      if(typeof body === 'string'){ try{ body = JSON.parse(body); }catch(e){} }

      if(type==='orders' && body.grade){
        let current = {};
        try{
          const R2 = getR2();
          const d = await R2.send(new GetObjectCommand({Bucket: BUCKET, Key: key}));
          const txt = await streamToString(d.Body);
          current = JSON.parse(txt);
        }catch(e){}
        const k = `${body.grade}|${body.term}|${body.subject}|${body.kind}`;
        current[k] = body.order;
        body = current;
      }

      const R2 = getR2();
      await R2.send(new PutObjectCommand({Bucket: BUCKET, Key: key, Body: JSON.stringify(body,null,2), ContentType: 'application/json; charset=utf-8'}));
      return res.status(200).json({ok:true});
    }catch(e){
      console.error('admin-data error', type, e);
      return res.status(500).json({error:e.message});
    }
  }

  return res.status(405).json({error:'Method not allowed'});
}