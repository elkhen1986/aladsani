import { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3';

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
    bodyParser: false, // we handle multipart manually
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({error:'Method not allowed'});
  
  try {
    const busboy = (await import('busboy')).default;
    const bb = busboy({ headers: req.headers });
    
    let fields = {};
    let fileBuffer = null;
    let fileName = '';
    
    bb.on('field', (name, val) => { fields[name] = val; });
    bb.on('file', (name, file, info) => {
      fileName = info.filename;
      const chunks = [];
      file.on('data', (d) => chunks.push(d));
      file.on('end', () => { fileBuffer = Buffer.concat(chunks); });
    });
    
    await new Promise((resolve, reject) => {
      bb.on('finish', resolve);
      bb.on('error', reject);
      req.pipe(bb);
    });

    if (!fileBuffer) return res.status(400).json({error:'No file'});

    const grade = fields.grade;
    const term = fields.term;
    const subject = fields.subject;
    const kind = fields.kind;
    const title = fields.title;

    const safeTitle = String(title).replace(/[^a-zA-Z0-9-_\u0600-\u06FF ]/g, '_').slice(0,60).replace(/\s+/g,'_');
    const key = `files/${grade}/${term}/${subject}/${kind}/${Date.now()}_${safeTitle}.pdf`;

    await R2.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: 'application/pdf',
    }));

    const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;
    
    return res.status(200).json({
      url: publicUrl,
      key: key,
      title: title,
      grade, term, subject, kind,
      size: fileBuffer.length,
      uploadedAt: new Date().toISOString()
    });

  } catch (e) {
    console.error('Upload R2 proxy error', e);
    return res.status(500).json({error: e.message});
  }
}