import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const R2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

export const config = {
  api: {
    bodyParser: false,
  },
};

function parseMultipart(buffer, boundary) {
  const result = { fields: {}, file: null, fileName: '' };
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
    
    if (!nameMatch) continue;
    const fieldName = nameMatch[1];
    
    if (filenameMatch) {
      result.fileName = filenameMatch[1];
      result.file = Buffer.from(content, 'binary');
    } else {
      // FIX: فك تشفير UTF-8 للعربي
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
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);
    
    const { fields, file } = parseMultipart(buffer, boundary);
    
    if (!file) return res.status(400).json({error:'No file uploaded'});

    const grade = fields.grade || 'unknown';
    const term = fields.term || 'term1';
    const subject = fields.subject || 'general';
    const kind = fields.kind || 'quizzes';
    const title = fields.title && fields.title.trim().length > 1 ? fields.title.trim() : 'ملف بدون عنوان';

    // تنظيف الاسم - يسمح عربي + انجليزي + ارقام
    let safeTitle = String(title).replace(/[^a-zA-Z0-9-_\u0600-\u06FF ]/g, '_').slice(0,80).replace(/\s+/g,'_').replace(/__+/g,'_').replace(/^_+|_+$/g,'');
    if (!safeTitle || safeTitle.length < 2 || safeTitle.toLowerCase() === 'undefined') {
      safeTitle = 'ملف_' + Date.now();
    }

    const key = `files/${grade}/${term}/${subject}/${kind}/${Date.now()}_${safeTitle}.pdf`;

    await R2.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: file,
      ContentType: 'application/pdf',
    }));

    const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;
    
    return res.status(200).json({
      url: publicUrl,
      key: key,
      title: title,
      grade, term, subject, kind,
      size: file.length,
      uploadedAt: new Date().toISOString()
    });

  } catch (e) {
    console.error('Upload R2 error', e);
    return res.status(500).json({error: e.message});
  }
}