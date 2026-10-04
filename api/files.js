import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

const R2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

export default async function handler(req, res) {
  try {
    if (!process.env.R2_BUCKET_NAME) {
      return res.status(200).json([]);
    }

    const command = new ListObjectsV2Command({
      Bucket: process.env.R2_BUCKET_NAME,
      Prefix: 'files/',
      MaxKeys: 1000,
    });

    const data = await R2.send(command);
    
    const files = (data.Contents || [])
      .filter(obj => obj.Key.endsWith('.pdf'))
      .map(obj => {
        const parts = obj.Key.split('/');
        if (parts.length < 6) return null;
        return {
          url: `${process.env.R2_PUBLIC_URL}/${obj.Key}`,
          key: obj.Key,
          grade: parts[1],
          term: parts[2],
          subject: parts[3],
          kind: parts[4],
          title: parts[5].replace(/^\d+_/, '').replace(/\.pdf$/, '').replace(/_/g, ' '),
          size: obj.Size,
          uploadedAt: obj.LastModified,
        };
      })
      .filter(Boolean);

    return res.status(200).json(files);
  } catch (err) {
    console.error('R2 list error', err.message);
    // لو Access Denied رجع لستة فاضية مؤقتا عشان الموقع مايقعش
    if (err.message.includes('AccessDenied') || err.message.includes('Access Denied')) {
      return res.status(200).json([]);
    }
    return res.status(500).json({ error: err.message });
  }
}