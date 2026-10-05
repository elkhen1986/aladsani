import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const R2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY },
});

export const config = { api: { bodyParser: false } };

function parseMultipart(buffer, boundary) {
  const result = { fields: {}, file: null, fileName: '' };
  const boundaryStr = '--' + boundary;
  const parts = buffer.toString('binary').split(boundaryStr);
  for (let part of parts) {
    if (!part || part === '--\r\n' || part === '--') continue;
    part = part.trim();
    if (!part) continue;
    const headerEnd = part.indexOf('\r\n\r\n');
    if (headerEnd === -1) continue;
    const headers = part.substring(0, headerEnd);
    let content = part.substring(headerEnd + 4);
    if (content.endsWith('\r\n')) content = content.slice(0, -2);
    const nameMatch = headers.match(/name="([^"]+)"/);
    const filenameMatch = headers.match(/filename="([^"]+)"/);
    if (!nameMatch) continue;
    const fieldName = nameMatch[1];
    if (filenameMatch) {
      result.fileName = filenameMatch[1];
      result.file = Buffer.from(content, 'binary');
    } else {
      try { result.fields[fieldName] = Buffer.from(content, 'binary').toString('utf8').trim(); }
      catch(e){ result.fields[fieldName] = content.trim(); }
    }
  }
  return result;
}

export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  try{
    const contentType = req.headers['content-type'] || '';
    const boundaryMatch = contentType.match(/boundary=(.+)/);
    if(!boundaryMatch) return res.status(400).json({error:'No boundary'});
    const boundary = boundaryMatch[1];
    const chunks=[]; for await(const chunk of req) chunks.push(chunk);
    const buffer = Buffer.concat(chunks);
    const { fields, file, fileName } = parseMultipart(buffer, boundary);
    if(!file) return res.status(400).json({error:'No file'});
    const ext = (fileName.split('.').pop()||'jpg').toLowerCase();
    if(!['jpg','jpeg','png','webp'].includes(ext)) return res.status(400).json({error:'صيغة الصورة يجب jpg/png/webp'});
    if(file.length>5*1024*1024) return res.status(400).json({error:'الصورة أكبر من 5MB'});
    const safe = (fields.name||fileName||'cover').replace(/[^a-zA-Z0-9-_\u0600-\u06FF]/g,'_').slice(0,40);
    const key = `subject-covers/${Date.now()}_${safe}.${ext}`;
    await R2.send(new PutObjectCommand({Bucket: process.env.R2_BUCKET_NAME, Key: key, Body: file, ContentType: 'image/'+(ext==='jpg'?'jpeg':ext)}));
    const url = `${process.env.R2_PUBLIC_URL}/${key}`;
    return res.status(200).json({url, key});
  }catch(e){ console.error('upload cover error', e); return res.status(500).json({error:e.message}); }
}