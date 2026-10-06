import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSession } from '../lib/auth.js';

const R2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});
const BUCKET = process.env.R2_BUCKET_NAME;

export default async function handler(req, res){
  if(req.method!=='POST') return res.status(405).json({error:'method not allowed'});
  const session = getSession(req);
  if(!session) return res.status(401).json({error:'not authenticated'});

  try{
    const body = typeof req.body==='string'? JSON.parse(req.body) : req.body;
    const { url, key } = body;

    let objectKey = key;
    if (!objectKey && url) {
      // استخرج الـ key من الـ public URL (نفس كودك القديم)
      try {
        const publicBase = process.env.R2_PUBLIC_URL;
        objectKey = url.replace(publicBase + '/', '');
      } catch(e){}
    }

    if (!objectKey ||!objectKey.startsWith('files/')) {
      return res.status(400).json({ error: 'Invalid key' });
    }

    // استخراج subject من key: files/grade/term/subject/kind/...
    var m = String(objectKey).match(/^files\/[^\/]+\/[^\/]+\/([^\/]+)\//);
    var subject = m? m[1] : null;

    if(session.role==='teacher'){
      if(!subject || (!session.subjects.includes(subject) &&!session.subjects.includes('*') &&!session.subjects.includes('all'))){
        return res.status(403).json({error:'forbidden - not your subject'});
      }
    }

    await R2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: objectKey }));
    return res.status(200).json({ok:true});
  }catch(e){
    console.error('delete error', e);
    return res.status(500).json({error:e.message});
  }
}