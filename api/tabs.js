import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';

const R2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY },
});
const BUCKET = process.env.R2_BUCKET_NAME;
const KEY = 'data/tabs.json';

async function streamToString(stream) {
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf-8');
}

export default async function handler(req,res){
  if(req.method==='GET'){
    try{
      const d = await R2.send(new GetObjectCommand({Bucket: BUCKET, Key: KEY}));
      const txt = await streamToString(d.Body);
      return res.status(200).json(JSON.parse(txt));
    }catch(e){
      return res.status(200).json({ subjectTabs:{}, gradeSubjectTabs:{} });
    }
  }
  if(req.method==='POST'){
    try{
      let body = req.body;
      if(typeof body==='string'){ try{ body=JSON.parse(body);}catch(e){} }
      await R2.send(new PutObjectCommand({Bucket: BUCKET, Key: KEY, Body: JSON.stringify(body,null,2), ContentType: 'application/json; charset=utf-8'}));
      return res.status(200).json({ok:true});
    }catch(e){ console.error(e); return res.status(500).json({error:e.message}); }
  }
  return res.status(405).json({error:'Method not allowed'});
}