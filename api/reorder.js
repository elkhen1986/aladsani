import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
const R2 = new S3Client({
  region:'auto',
  endpoint:`https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials:{accessKeyId:process.env.R2_ACCESS_KEY_ID, secretAccessKey:process.env.R2_SECRET_ACCESS_KEY},
});
const BUCKET = process.env.R2_BUCKET_NAME;
const KEY = 'data/files-order.json';

// { "10|term1|chemistry|quizzes": ["key1","key2"] }
export default async function handler(req,res){
  if(req.method==='GET'){
    try{
      const d = await R2.send(new GetObjectCommand({Bucket:BUCKET, Key:KEY}));
      const t = await d.Body.transformToString('utf-8');
      return res.status(200).json(JSON.parse(t));
    }catch(e){
      return res.status(200).json({});
    }
  }
  if(req.method==='POST'){
    try{
      const body = typeof req.body==='string'?JSON.parse(req.body):req.body;
      const { grade, term, subject, kind, order } = body;
      if(!grade||!term||!subject||!kind||!Array.isArray(order)) return res.status(400).json({error:'بيانات ناقصة'});
      let current={};
      try{
        const d = await R2.send(new GetObjectCommand({Bucket:BUCKET, Key:KEY}));
        const t = await d.Body.transformToString('utf-8');
        current = JSON.parse(t);
      }catch(e){}
      const key = `${grade}|${term}|${subject}|${kind}`;
      current[key]=order;
      await R2.send(new PutObjectCommand({Bucket:BUCKET, Key:KEY, Body:JSON.stringify(current,null,2), ContentType:'application/json; charset=utf-8'}));
      return res.status(200).json({ok:true});
    }catch(e){ return res.status(500).json({error:e.message}); }
  }
  return res.status(405).json({error:'Method not allowed'});
}
export const config={api:{bodyParser:{sizeLimit:'2mb'}}};