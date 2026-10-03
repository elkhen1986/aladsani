// قائمة كل الملفات المرفوعة (تُصفّى في المتصفح حسب الصف والفترة والمادة).
// نخزّن الاستجابة مؤقتاً على CDN لتوفير عمليات list في الخطة المجانية (LIST_CACHE_SECONDS).
import { list } from '@vercel/blob';
import { parsePath } from '../lib/files.js';

export default async function handler(req, res) {
  try {
    const out = [];
    let cursor;
    do {
      const page = await list({ prefix: 'files/', limit: 1000, cursor });
      for (const b of page.blobs) {
        const m = parsePath(b.pathname);
        if (m) out.push({ grade: m.grade, term: m.term, subject: m.subject, kind: m.kind, title: m.title,
          url: b.url, downloadUrl: b.downloadUrl, size: b.size, uploadedAt: b.uploadedAt });
      }
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);
    const ttl = Number(process.env.LIST_CACHE_SECONDS) || 900;
    res.setHeader('Cache-Control', `public, max-age=60, s-maxage=${ttl}, stale-while-revalidate=86400`);
    return res.status(200).json(out);
  } catch (e) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json([]); // أي خطأ (مثلاً Blob غير مفعّل بعد) = قائمة فارغة
  }
}
