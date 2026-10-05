import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';

const R2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME;
const KEY = 'data/staff.json';

async function streamToString(stream) {
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf-8');
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const data = await R2.send(new GetObjectCommand({ Bucket: BUCKET, Key: KEY }));
      const text = await streamToString(data.Body);
      const json = JSON.parse(text);
      return res.status(200).json(json);
    } catch (e) {
      if (e.name === 'NoSuchKey' || e.$metadata?.httpStatusCode === 404) {
        return res.status(200).json(null);
      }
      console.error('staff GET error', e);
      return res.status(200).json(null);
    }
  }

  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (!body || !body.departments) return res.status(400).json({ error: 'بيانات غير صحيحة' });
      
      const str = JSON.stringify(body);
      if (str.length > 2 * 1024 * 1024) return res.status(400).json({ error: 'البيانات كبيرة جدا' });

      await R2.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: KEY,
        Body: JSON.stringify(body, null, 2),
        ContentType: 'application/json; charset=utf-8',
      }));
      return res.status(200).json({ ok: true });
    } catch (e) {
      console.error('staff POST error', e);
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '3mb',
    },
  },
};