// مسارات الملفات المرفوعة في Vercel Blob:
//   files/<الصف>/<الفترة>/<المادة>/<النوع>/<الوقت>_<اسم الملف base64url>.pdf
// اسم الملف العربي يُحفظ مشفّراً داخل المسار، فلا نحتاج قاعدة بيانات.
export const PATH_RE =
  /^files\/(10|11-science|11-arts|12-science|12-arts)\/(term1|term2)\/([a-z0-9-]{2,40})\/(quizzes|exams)\/(\d{10,})_([A-Za-z0-9_-]{1,400})\.pdf$/;

export function parsePath(pathname) {
  const m = PATH_RE.exec(pathname || '');
  if (!m) return null;
  let title = '';
  try { title = Buffer.from(m[6], 'base64url').toString('utf8').trim(); } catch { return null; }
  if (!title) return null;
  return { grade: m[1], term: m[2], subject: m[3], kind: m[4], ts: Number(m[5]), title };
}

// رابط ملف تابع لمخزن Blob وبمسارنا فقط (حماية من حذف روابط أخرى)
export function isOurBlobUrl(u) {
  try {
    const x = new URL(u);
    return x.protocol === 'https:' && x.hostname.endsWith('.blob.vercel-storage.com') &&
      PATH_RE.test(decodeURIComponent(x.pathname.slice(1)));
  } catch { return false; }
}
