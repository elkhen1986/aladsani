import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

const R2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { url, key } = req.body;
  
  let objectKey = key;
  if (!objectKey && url) {
    // استخرج الـ key من الـ public URL
    try {
      const publicBase = process.env.R2_PUBLIC_URL;
      objectKey = url.replace(publicBase + '/', '');
    } catch(e){}
  }

  if (!objectKey || !objectKey.startsWith('files/')) {
    return res.status(400).json({ error: 'Invalid key' });
  }

  try {
    await R2.send(new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: objectKey,
    }));
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('R2 delete error', err);
    return res.status(500).json({ error: 'Delete failed' });
  }
}