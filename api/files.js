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
        const rawFile = parts[5];
        // استخراج الاسم
        let title = rawFile.replace(/^\d+_/, '').replace(/\.pdf$/i, '').replace(/_/g, ' ').trim();
        // fallback لو الاسم فاضي او undefined
        if (!title || title.toLowerCase() === 'undefined' || title.length < 2) {
          // حاول استخرج من raw بدون timestamp
          const withoutTs = rawFile.replace(/\.pdf$/i, '').replace(/_/g, ' ').trim();
          title = withoutTs.replace(/^\d+\s*/, '').trim() || 'ملف بدون عنوان';
        }
        return {
          url: `${process.env.R2_PUBLIC_URL}/${obj.Key}`,
          key: obj.Key,
          grade: parts[1],
          term: parts[2],
          subject: parts[3],
          kind: parts[4],
          title: title,
          size: obj.Size,
          uploadedAt: obj.LastModified,
        };
      })
      .filter(Boolean);

    return res.status(200).json(files);
  } catch (err) {
    console.error('R2 list error', err.message);
    if (err.message.includes('AccessDenied') || err.message.includes('Access Denied')) {
      return res.status(200).json([]);
    }
    return res.status(500).json({ error: err.message });
  }
}