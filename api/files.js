import { S3Client, ListObjectsV2Command, CopyObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const R2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

export default async function handler(req, res) {
  const BUCKET = process.env.R2_BUCKET_NAME;
  const PUBLIC_BASE = (process.env.R2_PUBLIC_URL || '').replace(/\/$/, '');

  // ---------- POST: تعديل اسم الملف (إعادة تسمية في R2) ----------
  if (req.method === 'POST') {
    try {
      let body = req.body;
      if (typeof body === 'string') { try { body = JSON.parse(body); } catch(e) {} }
      const url = body?.url;
      const keyFromBody = body?.key;
      let newTitle = (body?.title || '').toString().trim();
      
      if (!newTitle || newTitle.length < 2) return res.status(400).json({ error: 'No title' });
      if (!url && !keyFromBody) return res.status(400).json({ error: 'No url/key' });

      if (!BUCKET || !PUBLIC_BASE) return res.status(500).json({ error: 'Missing R2 env' });

      // استخراج المفتاح القديم
      let oldKey = keyFromBody || '';
      if (!oldKey && url) {
        try {
          // url = https://pub-xxx.r2.dev/files/...
          const u = new URL(url);
          oldKey = decodeURIComponent(u.pathname.replace(/^\//, ''));
        } catch(e) {
          // fallback لو url نسبي
          oldKey = decodeURIComponent(url.replace(PUBLIC_BASE, '').replace(/^\//, ''));
        }
      }
      if (!oldKey.startsWith('files/')) return res.status(400).json({ error: 'Invalid key: ' + oldKey });

      // تنظيف الاسم الجديد - عربي + انجليزي + ارقام
      let safeTitle = String(newTitle).replace(/[^a-zA-Z0-9-_\u0600-\u06FF ]/g, '_').slice(0,80).replace(/\s+/g,'_').replace(/__+/g,'_').replace(/^_+|_+$/g,'');
      if (!safeTitle || safeTitle.length < 2 || safeTitle.toLowerCase() === 'undefined' || safeTitle.toLowerCase() === 'file') {
        safeTitle = 'ملف_' + Date.now();
      }

      const parts = oldKey.split('/');
      if (parts.length < 5) return res.status(400).json({ error: 'Invalid key structure' });
      const prefix = parts.slice(0,5).join('/'); // files/grade/term/subject/kind
      const newFileName = `${Date.now()}_${safeTitle}.pdf`;
      const newKey = `${prefix}/${newFileName}`;

      if (oldKey === newKey) {
        // نفس الاسم، نرجع نجاح
        return res.status(200).json({ ok: true, url: `${PUBLIC_BASE}/${encodeURI(newKey)}`, key: newKey, title: newTitle });
      }

      // نسخ ثم حذف
      await R2.send(new CopyObjectCommand({
        Bucket: BUCKET,
        CopySource: `${BUCKET}/${oldKey}`,
        Key: newKey,
        ContentType: 'application/pdf'
      }));
      await R2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: oldKey }));

      const newUrl = `${PUBLIC_BASE}/${encodeURI(newKey).replace(/#/g, '%23')}`;
      return res.status(200).json({ ok: true, url: newUrl, key: newKey, title: newTitle, oldKey });

    } catch (e) {
      console.error('R2 rename error', e);
      return res.status(500).json({ error: e.message });
    }
  }

  // ---------- GET: قائمة كل الملفات ----------
  if (req.method === 'GET') {
    try {
      if (!BUCKET || !PUBLIC_BASE) {
        console.error('Missing R2 env vars');
        return res.status(200).json([]);
      }

      const command = new ListObjectsV2Command({
        Bucket: BUCKET,
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
            if (title.toLowerCase() === 'file') title = 'ملف بدون عنوان - احذفه وارفعه من جديد';
          }
          const finalUrl = `${PUBLIC_BASE}/${encodeURI(obj.Key).replace(/#/g, '%23')}`;
          
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

      files.sort((a,b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
      return res.status(200).json(files);
    } catch (err) {
      console.error('R2 list error', err);
      return res.status(200).json([]);
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}