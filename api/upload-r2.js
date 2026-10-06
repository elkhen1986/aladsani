import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const R2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

// خريطة الأنواع المدعومة - أي ملف غير موجود هنا سيتم رفضه
const MIME_TYPES = {
  pdf: 'application/pdf',
  html: 'text/html',
  htm: 'text/html',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  txt: 'text/plain'
};

const ALLOWED_EXTS = Object.keys(MIME_TYPES);

export const config = {
  api: { bodyParser: false },
};

function parseMultipart(buffer, boundary) {
  const result = { fields: {}, file: null, fileName: '', fileContentType: '' };
  const boundaryStr = '--' + boundary;
  const parts = buffer.toString('binary').split(boundaryStr);
  
  for (let part of parts) {
    if (!part || part === '--\r\n' || part === '--') continue;
    part = part.trim();
    if (!part) continue;
    
    const headerEnd = part.indexOf('\r\n\r\n');
    if (headerEnd === -1) continue;
    
    const headers = part.substring(0, headerEnd);
    let content = part.substring(headerEnd + 4);
    if (content.endsWith('\r\n')) content = content.slice(0, -2);
    
    const nameMatch = headers.match(/name="([^"]+)"/);
    const filenameMatch = headers.match(/filename="([^"]+)"/);
    const contentTypeMatch = headers.match(/Content-Type:\s*([^\r\n]+)/i);
    
    if (!nameMatch) continue;
    const fieldName = nameMatch[1];
    
    if (filenameMatch) {
      result.fileName = filenameMatch[1];
      result.file = Buffer.from(content, 'binary');
      if (contentTypeMatch) result.fileContentType = contentTypeMatch[1].trim();
    } else {
      // فك تشفير UTF-8 للعربي
      try {
        result.fields[fieldName] = Buffer.from(content, 'binary').toString('utf8').trim();
      } catch(e) {
        result.fields[fieldName] = content.trim();
      }
    }
  }
  return result;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({error:'Method not allowed'});
  
  try {
    const contentType = req.headers['content-type'] || '';
    const boundaryMatch = contentType.match(/boundary=(.+)/);
    if (!boundaryMatch) return res.status(400).json({error:'No boundary'});
    const boundary = boundaryMatch[1];

    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const buffer = Buffer.concat(chunks);
    
    const { fields, file, fileName } = parseMultipart(buffer, boundary);
    
    if (!file) return res.status(400).json({error:'No file uploaded'});
    if (!fileName) return res.status(400).json({error:'Missing filename'});

    // استخراج الامتداد من اسم الملف الأصلي
    const originalExtMatch = fileName.match(/\.([a-z0-9]+)$/i);
    let ext = originalExtMatch ? originalExtMatch[1].toLowerCase() : 'pdf';
    // توحيد jpeg -> jpg
    if (ext === 'jpeg') ext = 'jpg';
    
    if (!ALLOWED_EXTS.includes(ext) && ext !== 'jpg') {
      // تحقق إضافي لـ jpeg
      const cleanExt = originalExtMatch ? originalExtMatch[1].toLowerCase() : '';
      if (!ALLOWED_EXTS.includes(cleanExt) && !['jpg','jpeg'].includes(cleanExt)) {
        return res.status(400).json({
          error: `نوع الملف غير مدعوم .${ext}. الأنواع المدعومة: ${ALLOWED_EXTS.join(', ')}`
        });
      }
      ext = cleanExt.toLowerCase();
      if (ext === 'jpeg') ext = 'jpg';
    }

    const mimeType = MIME_TYPES[ext] || 'application/octet-stream';

    const grade = (fields.grade || 'unknown').toString().trim();
    const term = (fields.term || 'term1').toString().trim();
    const subject = (fields.subject || 'general').toString().trim();
    const kind = (fields.kind || 'quizzes').toString().trim();
    let title = (fields.title || '').toString().trim();
    if (!title || title.length < 2) title = fileName.replace(/\.[a-z0-9]+$/i,'') || 'ملف بدون عنوان';

    // تنظيف الاسم - يسمح عربي + انجليزي + ارقام
    let safeTitle = String(title).replace(/[^a-zA-Z0-9-_\u0600-\u06FF ]/g, '_').slice(0,80).replace(/\s+/g,'_').replace(/__+/g,'_').replace(/^_+|_+$/g,'');
    if (!safeTitle || safeTitle.length < 2 || safeTitle.toLowerCase() === 'undefined') {
      safeTitle = 'ملف_' + Date.now();
    }

    const key = `files/${grade}/${term}/${subject}/${kind}/${Date.now()}_${safeTitle}.${ext}`;

    // مهم جداً للموبايل: inline وليس attachment
    const encodedFileName = encodeURIComponent(`${safeTitle}.${ext}`);
    const contentDisposition = `inline; filename="${safeTitle}.${ext}"; filename*=UTF-8''${encodedFileName}`;

    await R2.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: file,
      ContentType: mimeType,
      ContentDisposition: contentDisposition,
      CacheControl: 'public, max-age=31536000, immutable'
    }));

    const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;
    
    return res.status(200).json({
      url: publicUrl,
      key: key,
      title: title,
      grade, term, subject, kind,
      ext: ext,
      mimeType: mimeType,
      size: file.length,
      uploadedAt: new Date().toISOString()
    });

  } catch (e) {
    console.error('Upload R2 error', e);
    return res.status(500).json({error: e.message});
  }
}