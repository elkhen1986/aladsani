// يُصدر تصريح رفع مباشر من المتصفح إلى Vercel Blob — للمشرف فقط، وبمسار وصيغة محددين.
import { handleUpload } from '@vercel/blob/client';
import { isAdmin, readJson } from '../lib/auth.js';
import { PATH_RE } from '../lib/files.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  try {
    const json = await handleUpload({
      body: readJson(req),
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        if (!isAdmin(req)) throw new Error('غير مصرّح');
        if (!PATH_RE.test(pathname)) throw new Error('مسار غير صالح');
        return {
          allowedContentTypes: ['application/pdf'],
          maximumSizeInBytes: 50 * 1024 * 1024, // 50MB
          addRandomSuffix: false,
        };
      },
    });
    return res.status(200).json(json);
  } catch (e) {
    return res.status(400).json({ error: e.message || 'upload_error' });
  }
}
