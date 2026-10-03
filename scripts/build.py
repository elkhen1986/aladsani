#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
مولّد صفحات منصة العدساني.
شغّله من جذر المشروع بعد أي تعديل على الصفوف أو المواد:   python scripts/build.py
يعيد إنشاء كل صفحات HTML وفولدرات الـPDF (ولا يمسّ ملفات الـPDF الموجودة).
"""
import pathlib
from html import escape

ROOT = pathlib.Path(__file__).resolve().parent.parent
SCHOOL = 'العدساني الثانوية'

TERMS = [  # (المجلد، الاسم الكامل، الرقم، الاسم المختصر)
    ('term1', 'الفترة الدراسية الأولى', '1', 'الفترة الأولى'),
    ('term2', 'الفترة الدراسية الثانية', '2', 'الفترة الثانية'),
]

SUBJ = {  # slug: (الاسم، رمز، درجة اللون)
    'quran': ('القرآن الكريم', '📖', 152), 'islamic': ('التربية الإسلامية', '🕌', 168),
    'arabic': ('اللغة العربية', '✍️', 22), 'english': ('اللغة الإنجليزية', '🔤', 262),
    'math': ('الرياضيات', '📐', 215), 'chemistry': ('الكيمياء', '🧪', 188),
    'physics': ('الفيزياء', '⚛️', 232), 'biology': ('الأحياء', '🧬', 128),
    'it': ('تقنية المعلومات', '💻', 245), 'kuwait-history': ('تاريخ الكويت', '🏛️', 35),
    'geology': ('الجيولوجيا', '⛰️', 18), 'statistics': ('الإحصاء', '📊', 205),
    'islamic-history': ('التاريخ الإسلامي', '📜', 42), 'french': ('اللغة الفرنسية', '🗼', 280),
    'psychology-sociology': ('علم النفس وعلم الاجتماع', '🧠', 300),
    'constitution': ('الدستور وحقوق الإنسان', '⚖️', 222),
    'modern-history': ('تاريخ العالم الحديث والمعاصر', '🌍', 175), 'philosophy': ('الفلسفة', '💭', 270),
}
COMMON = ['quran', 'islamic', 'arabic', 'english']
GRADES = [  # مجلد الصف، الاسم، اسم المسار، الشارة، مواده
    dict(slug='10', name='الصف العاشر', crumb='العاشر', badge='الصف 10',
         subjects=COMMON + ['math', 'chemistry', 'physics', 'biology', 'it', 'kuwait-history']),
    dict(slug='11-science', name='الحادي عشر علمي', crumb='الحادي عشر علمي', badge='11 علمي',
         subjects=COMMON + ['math', 'chemistry', 'physics', 'biology', 'geology', 'it']),
    dict(slug='11-arts', name='الحادي عشر أدبي', crumb='الحادي عشر أدبي', badge='11 أدبي',
         subjects=COMMON + ['statistics', 'islamic-history', 'french', 'psychology-sociology', 'it']),
    dict(slug='12-science', name='الثاني عشر علمي', crumb='الثاني عشر علمي', badge='12 علمي',
         subjects=COMMON + ['math', 'chemistry', 'physics', 'biology', 'constitution', 'it']),
    dict(slug='12-arts', name='الثاني عشر أدبي', crumb='الثاني عشر أدبي', badge='12 أدبي',
         subjects=COMMON + ['statistics', 'modern-history', 'french', 'philosophy', 'it']),
]
TILES = [  # (مجلد، الرقم، الوصف تحت الرقم، الاسم الكامل)
    ('10', '10', 'العاشر', 'الصف العاشر'), ('11-science', '11', 'علمي', 'الحادي عشر علمي'),
    ('11-arts', '11', 'أدبي', 'الحادي عشر أدبي'), ('12-science', '12', 'علمي', 'الثاني عشر علمي'),
    ('12-arts', '12', 'أدبي', 'الثاني عشر أدبي'),
]
ARROW = ('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" '
         'stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>')


# ------------------------------------------------------------------ قوالب مشتركة
def page(root, title, desc, active, body, scripts=(), extra_head=''):
    """root = المسار من الصفحة إلى جذر الموقع (../ بعدد العمق) — أو / لصفحة 404"""
    sc = ''.join(f'<script src="{root}{s}" data-root="{root}"></script>' for s in scripts)
    return f'''<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#0d2a54">
<meta name="description" content="{escape(desc)}">
{extra_head}<title>{escape(title)}</title>
<link rel="icon" type="image/png" href="{root}assets/favicon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap">
<link rel="stylesheet" href="{root}css/style.css">
</head>
<body>
<script src="{root}js/header.js" data-root="{root}" data-active="{active}"></script>
{body}
<script src="{root}js/footer.js" data-root="{root}"></script>
<script src="{root}js/main.js"></script>
{sc}
</body>
</html>
'''


def crumbs(items):
    """items: [(النص، الرابط أو None)] — الأخير بلا رابط"""
    parts = [f'<a href="{h}">{escape(t)}</a>' if h else f'<span>{escape(t)}</span>' for t, h in items]
    return '<nav class="crumbs" aria-label="المسار"><div class="wrap">' + '<i>/</i>'.join(parts) + '</div></nav>'


def write(rel, text):
    p = ROOT / rel
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(text, encoding='utf-8', newline='\n')


# ------------------------------------------------------------------ الصفحات
HOME = '''<main>
<section class="hero"><div class="wrap">
  <div>
    <span class="kicker">منصتكم التعليمية 2026-2027</span>
    <h2>مستقبل أبنائنا<span>يبدأ من هنا</span></h2>
    <p class="lead">منصة تعليمية متكاملة لجميع الصفوف والمواد، تضم كتب الطالب وبنوك الأسئلة والاختبارات القصيرة واختبارات نهاية الفترة، بإشراف قسم الكيمياء والفيزياء.</p>
    <div class="cta">
      <a class="btn btn-navy" href="10/index.html">ابدأ - الصف العاشر</a>
      <details class="menu"><summary class="btn btn-gold">مواد الثاني عشر</summary>
        <div class="menu-pop"><a href="12-science/index.html">الثاني عشر علمي</a><a href="12-arts/index.html">الثاني عشر أدبي</a></div></details>
    </div>
    <div class="free">مجاني 100% لجميع الطلبة</div>
  </div>
  <div class="logo-card"><div class="in">
    <img src="assets/logo.png" alt="شعار مدرسة عبدالرزاق محمد صالح العدساني الثانوية - بنين">
    <div class="tiles">%TILES%</div>
  </div></div>
</div></section>

<section class="section wrap" aria-labelledby="t-leaders">
  <div class="sec-head"><h2 class="sec-title" id="t-leaders">كلمة الإدارة المدرسية</h2></div>
  <div class="leaders" id="leaders"></div>
</section>

<section class="honor" aria-labelledby="t-honor"><div class="wrap">
  <div class="sec-head"><h2 class="sec-title" id="t-honor">لوحة شرف الفائقين</h2></div>
  <div class="car">
    <button type="button" class="arrow prev" id="prev" aria-label="السابق">›</button>
    <div class="track" id="track"></div>
    <button type="button" class="arrow next" id="next" aria-label="التالي">‹</button>
  </div>
</div></section>

<section class="section wrap"><div class="about">
  <div class="about-text" id="about-text"></div>
  <div><div class="sec-head" id="offers-head"></div><div class="offers" id="offers"></div></div>
</div></section>
</main>
<div class="modal" id="lightbox"><div class="m-box lb"><button type="button" class="m-x" aria-label="إغلاق">✕</button><img alt=""><h3></h3><p></p></div></div>'''


def build_home():
    tiles = ''.join(
        f'<a class="tile" href="{s}/index.html" title="{full}" aria-label="{full}"><b>{n}</b><small>{lab}</small></a>'
        for s, n, lab, full in TILES)
    write('index.html', page('', f'منصة {SCHOOL} التعليمية 2026-2027',
          'منصة تعليمية متكاملة لطلبة مدرسة عبدالرزاق محمد صالح العدساني الثانوية بنين: كتب وبنوك أسئلة واختبارات.',
          'home', HOME.replace('%TILES%', tiles), ['data/content.js', 'js/home.js']))


def build_staff():
    body = (crumbs([('الرئيسية', '../index.html'), ('الهيئة التعليمية', None)]) +
            '<main class="wrap"><h1 class="sr-only">الهيئة التعليمية</h1>'
            '<section class="lead-row" id="leadRow" aria-label="الإدارة المدرسية"></section>'
            '<div id="depts"></div></main>')
    write('staff/index.html', page('../', f'الهيئة التعليمية | {SCHOOL}',
          'الهيئة الإدارية والتعليمية في مدرسة عبدالرزاق محمد صالح العدساني الثانوية بنين.',
          'staff', body, ['data/content.js', 'js/staff.js']))


def build_admin():
    body = ('<main class="center-box"><div class="a-card"><img src="../assets/emblem.png" alt="">'
            '<div id="adminBox"></div></div></main>')
    write('admin/index.html', page('../', f'دخول المشرف | {SCHOOL}', 'دخول المشرف لإدارة الملفات.', '', body,
          ['js/admin.js'], '<meta name="robots" content="noindex">\n'))


def build_404():
    body = ('<main class="center-box"><div class="a-card"><div class="err404">404</div><h1>الصفحة غير موجودة</h1>'
            '<p>الرابط غير صحيح أو تم نقل الصفحة.</p><a class="btn btn-navy" href="/index.html">العودة للرئيسية</a></div></main>')
    write('404.html', page('/', f'الصفحة غير موجودة | {SCHOOL}', 'الصفحة غير موجودة.', '', body, [],
          '<meta name="robots" content="noindex">\n'))


def build_grade(g):
    n = len(g['subjects'])
    cards = ''
    for i, (slug, full, num, short) in enumerate(TERMS, 1):
        cards += (f'<a class="term t{i}" href="{slug}/index.html"><span class="num" aria-hidden="true">{num}</span>'
                  f'<span class="badge">{g["name"]}</span><h2>{full}</h2><span class="meta">{n} مواد</span>'
                  f'<span class="go">دخول {ARROW}</span></a>')
    body = crumbs([('الرئيسية', '../index.html'), (g['crumb'], None)]) + f'<main class="wrap terms">{cards}</main>'
    write(f'{g["slug"]}/index.html', page('../', f'{g["name"]} | {SCHOOL}',
          f'الفترة الدراسية الأولى والثانية لـ{g["name"]} في مدرسة العدساني الثانوية.', g['slug'], body))


def build_term(g, t):
    slug, full, num, short = t
    cards = ''
    for s in g['subjects']:
        name, emoji, hue = SUBJ[s]
        cards += (f'<a class="subj" href="{s}/index.html" data-s="{s}" style="--h:{hue}">'
                  f'<div class="cover" aria-hidden="true"><span class="emo">{emoji}</span></div>'
                  f'<span class="badge">{g["badge"]}</span><h3>{name}</h3></a>')
    body = (crumbs([('الرئيسية', '../../index.html'), (g['crumb'], '../index.html'), (short, None)]) +
            f'<main class="wrap"><div class="subjects">{cards}</div></main>')
    write(f'{g["slug"]}/{slug}/index.html', page('../../', f'{short} | {g["name"]} | {SCHOOL}',
          f'مواد {g["name"]} - {full}.', g['slug'], body, ['data/content.js', 'js/covers.js']))


TAB_HTML = ''.join(
    f'<button type="button" class="tab" role="tab" data-tab="{k}">{v}</button>' for k, v in
    [('book', 'كتاب الطالب'), ('qbank', 'بنك الأسئلة'), ('quizzes', 'اختبارات قصيرة'), ('exams', 'اختبارات نهاية الفترة')])


def build_subject(g, t, s):
    slug, full, num, short = t
    name = SUBJ[s][0]
    r = '../../../'
    body = (crumbs([('الرئيسية', r + 'index.html'), (g['crumb'], '../../index.html'), (short, '../index.html'), (name, None)]) +
            f'<div class="tabs-bar"><div class="wrap"><div class="tabs" role="tablist" aria-label="أقسام المادة">{TAB_HTML}</div></div></div>'
            f'<main id="subject" data-grade="{g["slug"]}" data-term="{slug}" data-subject="{s}" data-title="{name}" '
            f'data-pdf="{r}pdf/{g["slug"]}/{slug}/{s}/"><section class="panel" id="panel" aria-live="polite"></section></main>')
    write(f'{g["slug"]}/{slug}/{s}/index.html', page(r, f'{name} | {g["name"]} | {short} | {SCHOOL}',
          f'كتاب الطالب وبنك الأسئلة والاختبارات القصيرة واختبارات نهاية الفترة لمادة {name} - {g["name"]}.',
          g['slug'], body, ['js/viewer.js', 'js/subject.js']))
    keep = ROOT / 'pdf' / g['slug'] / slug / s
    keep.mkdir(parents=True, exist_ok=True)
    (keep / '.gitkeep').touch()


PDF_README = '''# ملفات الـPDF

كل مادة لها فولدر خاص بها بنفس شجرة الموقع:

    pdf/<الصف>/<الفترة>/<المادة>/book.pdf    ← تبويب «كتاب الطالب»
    pdf/<الصف>/<الفترة>/<المادة>/qbank.pdf   ← تبويب «بنك الأسئلة»

مثال: pdf/10/term1/chemistry/book.pdf

* الصفوف: 10 ، 11-science ، 11-arts ، 12-science ، 12-arts
* الفترات: term1 (الأولى) ، term2 (الثانية)
* الاسمان book.pdf و qbank.pdf ثابتان (حروف صغيرة). إن لم يوجد الملف تظهر رسالة «لم يُرفع بعد».
* «اختبارات قصيرة» و«اختبارات نهاية الفترة» لا توضع هنا؛ تُضاف من الموقع بواسطة المشرف (صفحة /admin).
* حدّ GitHub: الملف الواحد أقل من 100MB (ويُفضّل أقل من 50MB). اضغط الملفات الكبيرة قبل الرفع.
'''


def main():
    build_home(); build_staff(); build_admin(); build_404()
    pages = 4
    for g in GRADES:
        build_grade(g); pages += 1
        for t in TERMS:
            build_term(g, t); pages += 1
            for s in g['subjects']:
                build_subject(g, t, s); pages += 1
    write('pdf/README.md', PDF_README)
    write('assets/img/subjects/README.txt',
          'لتبديل غلاف أي مادة بصورة حقيقية: (1) ضع صورة JPG هنا باسم المادة، مثال: chemistry.jpg\n'
          '(2) أضف اسم المادة إلى covers في ملف data/content.js، مثال: covers: [\'chemistry\']\n'
          'أسماء الملفات: ' + ' ، '.join(f'{k}.jpg' for k in SUBJ) + '\n')
    print(f'تم إنشاء {pages} صفحة، و{sum(len(g["subjects"]) for g in GRADES) * 2} فولدر مادة داخل pdf/')


if __name__ == '__main__':
    main()
