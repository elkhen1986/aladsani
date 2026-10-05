import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
const R2 = new S3Client({
  region:'auto',
  endpoint:`https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials:{accessKeyId:process.env.R2_ACCESS_KEY_ID, secretAccessKey:process.env.R2_SECRET_ACCESS_KEY},
});
export const config={api:{bodyParser:false}};
export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  try{
    const ct = req.headers['content-type']||'';
    const bMatch = ct.match(/boundary=(.+)/);
    if(!bMatch) return res.status(400).json({error:'No boundary'});
    const boundary = bMatch[1];
    const chunks=[]; for await(const c of req) chunks.push(c);
    const buffer = Buffer.concat(chunks);
    const boundaryStr='--'+boundary;
    const parts = buffer.toString('binary').split(boundaryStr);
    let file=null, fileName='', fields={};
    for(let part of parts){
      if(!part||part==='--\r\n'||part==='--') continue;
      part=part.trim(); if(!part) continue;
      const he = part.indexOf('\r\n\r\n'); if(he===-1) continue;
      const headers=part.substring(0,he); let content=part.substring(he+4);
      if(content.endsWith('\r\n')) content=content.slice(0,-2);
      const nm=headers.match(/name="([^"]+)"/); const fn=headers.match(/filename="([^"]+)"/);
      if(!nm) continue;
      if(fn){ file=Buffer.from(content,'binary'); fileName=fn[1]; }
      else{ fields[nm[1]]=Buffer.from(content,'binary').toString('utf8').trim(); }
    }
    if(!file) return res.status(400).json({error:'No file'});
    const ext = fileName.split('.').pop().toLowerCase();
    if(!['jpg','jpeg','png','webp'].includes(ext)) return res.status(400).json({error:'صيغة غير مدعومة'});
    if(file.length>5*1024*1024) return res.status(400).json({error:'الصورة أكبر من 5MB'});
    const safeName = (fields.name||fileName).replace(/[^a-zA-Z0-9-_\u0600-\u06FF]/g,'_').slice(0,50);
    const key = `subject-covers/${Date.now()}_${safeName}.${ext}`;
    await R2.send(new PutObjectCommand({Bucket:process.env.R2_BUCKET_NAME, Key:key, Body:file, ContentType:'image/'+(ext==='jpg'?'jpeg':ext)}));
    const url = `${process.env.R2_PUBLIC_URL}/${key}`;
    return res.status(200).json({url, key});
  }catch(e){ console.error(e); return res.status(500).json({error:e.message}); }
}