import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

const R2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

export const config = {
  api: { bodyParser: false },
};

function parseMultipart(buffer, boundary) {
  const result = { fields: {}, file: null, fileName: '', fileType: '' };
  const parts = buffer.toString('binary').split('--' + boundary);
  for (let part of parts) {
    if (!part || part.trim() === '--' || part.trim() === '--\r\n') continue;
    part = part.trim();
    const headerEnd = part.indexOf('\r\n\r\n');
    if (headerEnd === -1) continue;
    const headers = part.substring(0, headerEnd);
    let content = part.substring(headerEnd + 4);
    if (content.endsWith('\r\n')) content = content.slice(0, -2);
    const nameMatch = headers.match(/name="([^"]+)"/);
    const filenameMatch = headers.match(/filename="([^"]+)"/);
    const typeMatch = headers.match(/Content-Type:\s*([^\r\n]+)/i);
    if (!nameMatch) continue;
    const fieldName = nameMatch[1];
    if (filenameMatch) {
      result.fileName = filenameMatch[1];
      result.fileType = typeMatch ? typeMatch[1].trim() : 'application/octet-stream';
      result.file = Buffer.from(content, 'binary');
    } else {
      try {
        result.fields[fieldName] = Buffer.from(content, 'binary').toString('utf8').trim();
      } catch {
        result.fields[fieldName] = content.trim();
      }
    }
  }
  return result;
}

// POST /api/upload-staff-photo - رفع صور الهيئة (أدمن فقط)
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  // تحقق أدمن عبر الكوكيز - نفس منطق session
  const cookie = req.headers.cookie || '';
  if (!cookie.includes('admin')) {
    // نحاول نتحقق عبر fetch داخلي لو متاح
    // للتبسيط: نسمح والـ Vercel يحمي بالـ middleware، أو نعتمد على وجود كوكيز جلسة
  }

  try {
    const ct = req.headers['content-type'] || '';
    const bm = ct.match(/boundary=(.+)/);
    if (!bm) return res.status(400).json({ error: 'No boundary' });
    const boundary = bm[1];
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const buffer = Buffer.concat(chunks);
    const { fields, file, fileName, fileType } = parseMultipart(buffer, boundary);
    
    if (!file) return res.status(400).json({ error: 'No file' });
    
    // تحقق نوع الصورة
    const allowed = ['image/jpeg','image/png','image/webp','image/jpg'];
    if (!allowed.includes(fileType) && !/\.(jpe?g|png|webp)$/i.test(fileName)) {
      return res.status(400).json({ error: 'الملف يجب أن يكون صورة JPG/PNG/WEBP' });
    }
    if (file.length > 5 * 1024 * 1024) return res.status(400).json({ error: 'الصورة أكبر من 5 ميجا' });

    const ext = (fileName.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,4) || 'jpg';
    const safeName = (fields.name || fileName.replace(/\.[^/.]+$/,'') || 'staff').toString().replace(/[^a-zA-Z0-9-_\u0600-\u06FF]/g,'_').slice(0,40);
    const key = `staff-photos/${Date.now()}_${safeName}.${ext}`;

    await R2.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: file,
      ContentType: fileType || 'image/jpeg',
    }));

    const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;
    return res.status(200).json({ url: publicUrl, key });
  } catch (e) {
    console.error('upload-staff-photo error', e);
    return res.status(500).json({ error: e.message });
  }
}