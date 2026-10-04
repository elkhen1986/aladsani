import { S3Client } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';

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

  const { grade, term, subject, kind, title, size } = req.body;
  
  if (!grade || !term || !subject || !kind) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  if (size > 50 * 1024 * 1024) {
    return res.status(400).json({ error: 'File too large' });
  }
  if (!process.env.R2_BUCKET_NAME || !process.env.R2_ACCOUNT_ID) {
    return res.status(500).json({ error: 'R2 env vars missing' });
  }

  const safeTitle = String(title).replace(/[^a-zA-Z0-9-_\u0600-\u06FF ]/g, '_').slice(0,60).replace(/\s+/g,'_');
  const key = `files/${grade}/${term}/${subject}/${kind}/${Date.now()}_${safeTitle}.pdf`;

  try {
    const post = await createPresignedPost(R2, {
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Conditions: [
        ['content-length-range', 1, 50 * 1024 * 1024],
        ['starts-with', '$Content-Type', 'application/pdf'],
      ],
      Fields: { 'Content-Type': 'application/pdf' },
      Expires: 120,
    });

    return res.status(200).json({
      url: post.url,
      fields: post.fields,
      key: key,
      publicUrl: `${process.env.R2_PUBLIC_URL}/${key}`
    });
  } catch (err) {
    console.error('R2 presign error', err);
    return res.status(500).json({ error: 'Presign failed: ' + err.message });
  }
}