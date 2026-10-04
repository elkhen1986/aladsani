import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

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

  if (!process.env.R2_BUCKET_NAME || !process.env.R2_PUBLIC_URL) {
    return res.status(500).json({ error: 'R2 env not configured' });
  }

  const safeTitle = String(title).replace(/[^a-zA-Z0-9-_\u0600-\u06FF ]/g, '_').slice(0,60).replace(/\s+/g,'_');
  const key = `files/${grade}/${term}/${subject}/${kind}/${Date.now()}_${safeTitle}.pdf`;

  try {
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      ContentType: 'application/pdf',
    });

    const signedUrl = await getSignedUrl(R2, command, { expiresIn: 120 });

    return res.status(200).json({
      uploadUrl: signedUrl,
      key: key,
      publicUrl: `${process.env.R2_PUBLIC_URL}/${key}`
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}