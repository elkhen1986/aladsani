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

PDF_BASE = "https://pub-56a4d2fe52a44044b6f3e74c57f80262.r2.dev/"

TERMS = [
    ('term1', 'الفترة الدراسية الأولى', '1', 'الفترة الأولى'),
    ('term2', 'الفترة الدراسية الثانية', '2', 'الفترة الثانية'),
]

SUBJ = {
    'quran': ('القرآن الكريم', '📖', 152), 'islamic': ('التربية الإسلامية', '🕌', 168),
    'arabic': ('اللغة العربية', '✍', 22), 'english': ('اللغة الإنجليزية', '🔤', 262),
    'math': ('الرياضيات', '📐', 215), 'chemistry': ('الكيمياء', '🧪', 188),
    'physics': ('الفيزياء', '⚛', 232), 'biology': ('الأحياء', '🧬', 128),
    'it': ('تقنية المعلومات', '💻', 245), 'kuwait-history': ('تاريخ الكويت', '🏛', 35),
    'geology': ('الجيولوجيا', '⛰', 18), 'statistics': ('الإحصاء', '📊', 205),
    'islamic-history': ('التاريخ الإسلامي', '📜', 42), 'french': ('اللغة الفرنسية', '🗼', 280),
    'psychology-sociology': ('علم النفس وعلم الاجتماع', '🧠', 300),
    'constitution': ('الدستور وحقوق الإنسان', '⚖', 222),
    'modern-history': ('تاريخ العالم الحديث والمعاصر', '🌍', 175), 'philosophy': ('الفلسفة', '💭', 270),
    'geo-econ': ('مبادئ علم الجغرافيا وعلم الاقتصاد', '🌍', 95),
}
COMMON = ['quran', 'islamic', 'arabic', 'english']
GRADES = [
    dict(slug='10', name='الصف العاشر', crumb='العاشر', badge='الصف 10',
         subjects=COMMON + ['math', 'chemistry', 'physics', 'biology', 'it', 'kuwait-history']),
    dict(slug='11-science', name='الحادي عشر علمي', crumb='الحادي عشر علمي', badge='11 علمي',
         subjects=COMMON + ['math', 'chemistry', 'physics', 'biology', 'geology', 'it']),
    dict(slug='11-arts', name='الحادي عشر أدبي', crumb='الحادي عشر أدبي', badge='11 أدبي',
         subjects=COMMON + ['statistics', 'islamic-history', 'french', 'psychology-sociology', 'geo-econ', 'it']),
    dict(slug='12-science', name='الثاني عشر علمي', crumb='الثاني عشر علمي', badge='12 علمي',
         subjects=COMMON + ['math', 'chemistry', 'physics', 'biology', 'constitution', 'it']),
    dict(slug='12-arts', name='الثاني عشر أدبي', crumb='الثاني عشر أدبي', badge='12 أدبي',
         subjects=COMMON + ['statistics', 'modern-history', 'french', 'philosophy', 'constitution', 'it']),
]
TILES = [
    ('10', '10', 'العاشر', 'الصف العاشر'), ('11-science', '11', 'علمي', 'الحادي عشر علمي'),
    ('11-arts', '11', 'أدبي', 'الحادي عشر أدبي'), ('12-science', '12', 'علمي', 'الثاني عشر علمي'),
    ('12-arts', '12', 'أدبي', 'الثاني عشر أدبي'),
]
ARROW = ('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" '
         'stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>')


def page(root, title, desc, active, body, scripts=(), extra_head=''):
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
    parts = [f'<a href="{h}">{escape(t)}</a>' if h else f'<span>{escape(t)}</span>' for t, h in items]
    return '<nav class="crumbs" aria-label="المسار"><div class="wrap">' + '<i>/</i>'.join(parts) + '</div></nav>'


def write(rel, text):
    p = ROOT / rel
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(text, encoding='utf-8', newline='\n')


def get_tabs_html(grade_slug, subject_slug):
    is_senior = grade_slug.startswith('11') or grade_slug.startswith('12')
    if subject_slug == 'english':
        tabs = [
            ('book', "Student's Book"),
            ('workbook', 'Workbook'),
            ('qbank', 'بنك الأسئلة'),
            ('worksheets', 'أوراق عمل'),
            ('quizzes', 'اختبارات قصيرة'),
            ('exams', 'اختبارات نهاية الفترة')
        ]
    elif subject_slug == 'arabic':
        if grade_slug.startswith('12'):
            tabs = [
                ('book', 'كتاب الطالب'),
                ('nahw', 'قواعد النحو والصرف'),
                ('qbank', 'بنك الأسئلة'),
                ('worksheets', 'أوراق عمل'),
                ('quizzes', 'اختبارات قصيرة'),
                ('exams', 'اختبارات نهاية الفترة')
            ]
        else:
            tabs = [
                ('book', 'كتاب الطالب'),
                ('nahw', 'قواعد النحو والصرف'),
                ('balagha', 'فنون البلاغة'),
                ('qbank', 'بنك الأسئلة'),
                ('worksheets', 'أوراق عمل'),
                ('quizzes', 'اختبارات قصيرة'),
                ('exams', 'اختبارات نهاية الفترة')
            ]
    elif is_senior and subject_slug in ('math', 'statistics'):
        tabs = [
            ('book', 'كتاب الطالب'),
            ('exercises', 'كتاب التمارين'),
            ('qbank', 'بنك الأسئلة'),
            ('worksheets', 'أوراق عمل'),
            ('quizzes', 'اختبارات قصيرة'),
            ('exams', 'اختبارات نهاية الفترة')
        ]
    elif is_senior and subject_slug in ('chemistry', 'physics', 'biology', 'geology'):
        tabs = [
            ('book', 'كتاب الطالب'),
            ('applications', 'كراسة التطبيقات'),
            ('qbank', 'بنك الأسئلة'),
            ('worksheets', 'أوراق عمل'),
            ('quizzes', 'اختبارات قصيرة'),
            ('exams', 'اختبارات نهاية الفترة')
        ]
    else:
        tabs = [
            ('book', 'كتاب الطالب'),
            ('qbank', 'بنك الأسئلة'),
            ('worksheets', 'أوراق عمل'),
            ('quizzes', 'اختبارات قصيرة'),
            ('exams', 'اختبارات نهاية الفترة')
        ]
    return ''.join(
        f'<button type="button" class="tab" role="tab" data-tab="{k}">{v}</button>' for k, v in tabs
    )

TAB_HTML = ''.join(
    f'<button type="button" class="tab" role="tab" data-tab="{k}">{v}</button>' for k, v in
    [('book', 'كتاب الطالب'), ('qbank', 'بنك الأسئلة'), ('quizzes', 'اختبارات قصيرة'), ('exams', 'اختبارات نهاية الفترة')])

HOME = '''<main>
<section class="hero"><div class="wrap">
  <div>
    <span class="kicker">منصتكم التعليمية 2026-2027</span>
    <h2>مستقبل أبنائنا<span>يبدأ من هنا</span></h2>
    <p class="lead">في ثانوية العدساني، نحن لا نُعدّكم لاختبارٍ عابر، بل نُعدّكم لحياةٍ كاملة. نؤمن أن داخل كل واحدٍ منكم قائدًا ينتظر أن يستيقظ، وحلمًا كبيرًا يستحق أن يُقاتل من أجله حتى الرمق الأخير. هذه المنصة ليست مجرد كتبٍ وصفحات، بل هي عهدٌ نقطعه معكم، أن نسير معكم خطوةً بخطوة، من أول حرفٍ حتى لحظة التتويج، حتى يصبح تعب اليوم فخر الغد، وتصبحون أنتم فخر هذا الوطن ومستقبله.</p>
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


def build_subject(g, t, s):
    slug, full, num, short = t
    name = SUBJ[s][0]
    r = '../../../'
    tabs_html = get_tabs_html(g['slug'], s)
    body = (crumbs([('الرئيسية', r + 'index.html'), (g['crumb'], '../../index.html'), (short, '../index.html'), (name, None)]) +
            f'<div class="tabs-bar"><div class="wrap"><div class="tabs" role="tablist" aria-label="أقسام المادة">{tabs_html}</div></div></div>'
            f'<main id="subject" data-grade="{g["slug"]}" data-term="{slug}" data-subject="{s}" data-title="{name}" '
            f'data-pdf="{PDF_BASE}pdf/{g["slug"]}/{slug}/{s}/"><section class="panel" id="panel" aria-live="polite"></section></main>')
    write(f'{g["slug"]}/{slug}/{s}/index.html', page(r, f'{name} | {g["name"]} | {short} | {SCHOOL}',
          f'كتاب الطالب وبنك الأسئلة والاختبارات القصيرة واختبارات نهاية الفترة لمادة {name} - {g["name"]}.',
          g['slug'], body, ['js/viewer.js', 'js/subject.js']))
    keep = ROOT / 'pdf' / g['slug'] / slug / s
    keep.mkdir(parents=True, exist_ok=True)
    (keep / '.gitkeep').touch()


PDF_README = '''# ملفات الـPDF

كل مادة لها فولدر خاص بها بنفس شجرة الموقع:

    pdf/<الصف>/<الفترة>/<المادة>/book.pdf    <- تبويب كتاب الطالب او Student's Book
    pdf/<الصف>/<الفترة>/<المادة>/workbook.pdf  <- انجليزي فقط: Workbook
    pdf/<الصف>/<الفترة>/<المادة>/exercises.pdf <- حادي عشر وثاني عشر رياضيات واحصاء: كتاب التمارين
    pdf/<الصف>/<الفترة>/<المادة>/applications.pdf <- حادي عشر وثاني عشر كيمياء فيزياء احياء جيولوجيا: كراسة التطبيقات
    pdf/<الصف>/<الفترة>/<المادة>/nahw.pdf <- عربي: قواعد النحو والصرف
    pdf/<الصف>/<الفترة>/<المادة>/balagha.pdf <- عربي: فنون البلاغة
    pdf/<الصف>/<الفترة>/<المادة>/qbank.pdf   <- تبويب بنك الأسئلة

مثال: pdf/10/term1/chemistry/book.pdf

* الصفوف: 10 ، 11-science ، 11-arts ، 12-science ، 12-arts
* الفترات: term1 (الأولى) ، term2 (الثانية)
* ان لم يوجد الملف تظهر رسالة لم يُرفع بعد.
* اختبارات قصيرة ونهاية الفترة لا توضع هنا؛ تُضاف من الموقع بواسطة المشرف (صفحة /admin).
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
    print('المادة الجديدة: geo-econ في حادي عشر أدبي')
    print('التبويبات الديناميكية مفعلة')
    print(f'الكتب الآن من R2: {PDF_BASE}')


if __name__ == '__main__':
    main()