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
    if (!process.env.R2_BUCKET_NAME || !process.env.R2_PUBLIC_URL) {
      console.error('Missing R2 env vars');
      return res.status(200).json([]);
    }

    const command = new ListObjectsV2Command({
      Bucket: process.env.R2_BUCKET_NAME,
      Prefix: 'files/',
      MaxKeys: 1000,
    });

    const data = await R2.send(command);
    
    const files = (data.Contents || [])
      .filter(obj => obj.Key.toLowerCase().endsWith('.pdf'))
      .map(obj => {
        const parts = obj.Key.split('/');
        if (parts.length < 6) return null;
        const rawFile = parts[5];
        let title = rawFile.replace(/^\d+_/, '').replace(/\.pdf$/i, '').replace(/_/g, ' ').trim();
        if (!title || title.toLowerCase() === 'undefined' || title.toLowerCase() === 'file' || title.length < 2) {
          const withoutTs = rawFile.replace(/\.pdf$/i, '').replace(/_/g, ' ').trim();
          title = withoutTs.replace(/^\d+\s*/, '').trim() || 'ملف بدون عنوان';
          // لو لسه file خليه بدون عنوان عشان نعرف انه بايظ
          if (title.toLowerCase() === 'file') title = 'ملف بدون عنوان - احذفه وارفعه من جديد';
        }
        // ترميز الرابط عشان العربي
        const encodedKey = obj.Key.split('/').map(encodeURIComponent).join('/');
        // لكن نحتفظ بـ / بين الاجزاء
        const publicBase = process.env.R2_PUBLIC_URL.replace(/\/$/, '');
        const url = `${publicBase}/${encodedKey.split('/').map((p,i)=> i<1 ? p : encodeURIComponent(decodeURIComponent(p))).join('/')}`.replace(/%2F/g,'/');
        // طريقة اسهل: encodeURI يحافظ على / ويرمز العربي
        const finalUrl = `${publicBase}/${encodeURI(obj.Key).replace(/#/g, '%23')}`;
        
        return {
          url: finalUrl,
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

    // ترتيب الاحدث اولا
    files.sort((a,b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

    return res.status(200).json(files);
  } catch (err) {
    console.error('R2 list error', err);
    return res.status(200).json([]);
  }
}