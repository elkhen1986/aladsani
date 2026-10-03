#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
فاحص الروابط والهيكل — شغّله بعد أي تعديل:   python scripts/check_links.py
يتحقق من: كل رابط/صورة/سكربت/ستايل في كل صفحة، تبويبات الهيدر، صور content.js، data-root لكل صفحة،
فولدرات الـPDF لكل مادة، وسلامة فتح/إغلاق الوسوم. يخرج بكود 1 إن وُجد أي خطأ.
"""
import os, pathlib, re, sys
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote

ROOT = pathlib.Path(__file__).resolve().parent.parent
VOID = {'meta', 'link', 'img', 'br', 'hr', 'input', 'source', 'path'}
OPTIONAL = ('assets/img/subjects/',)          # أغلفة اختيارية: غيابها ليس خطأ
errors, warns, stats = [], [], {'pages': 0, 'refs': 0}


class P(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.refs, self.stack, self.problems, self.attrs_log = [], [], [], []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        for k in ('href', 'src'):
            if a.get(k):
                self.refs.append((tag, k, a[k]))
        if a.get('data-pdf'):
            self.refs.append((tag, 'data-pdf', a['data-pdf']))
        if tag == 'script' and a.get('src', '').endswith(('header.js', 'footer.js')):
            self.attrs_log.append((a['src'], a.get('data-root'), a.get('data-active')))
        if tag not in VOID:
            self.stack.append(tag)

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in VOID and self.stack:
            self.stack.pop()

    def handle_endtag(self, tag):
        if tag in VOID:
            return
        if not self.stack or self.stack[-1] != tag:
            self.problems.append(f'وسم </{tag}> غير متوازن')
            if tag in self.stack:
                while self.stack and self.stack.pop() != tag:
                    pass
        else:
            self.stack.pop()


def external(u):
    return u.startswith(('http://', 'https://', '//', 'mailto:', 'tel:', 'javascript:', 'data:', '#'))


def target(base_dir, ref, root_abs=True):
    path = unquote(urlsplit(ref).path)
    if not path:
        return None
    p = (ROOT / path.lstrip('/')) if path.startswith('/') else (base_dir / path)
    p = pathlib.Path(os.path.normpath(p))          # يحلّ ../ حتى تُقارن المسارات بشكل صحيح
    return (p / 'index.html') if (path.endswith('/') or p.is_dir()) else p


# ---- 1) كل صفحات HTML
header_js = (ROOT / 'js' / 'header.js').read_text(encoding='utf-8')
tab_keys = set(re.findall(r"k:\s*'([^']+)'", header_js))
tab_hrefs = re.findall(r"href:\s*'([^']+)'", header_js)
for h in tab_hrefs:
    if not (ROOT / h).is_file():
        errors.append(f'header.js: تبويب يشير لملف غير موجود -> {h}')
if len(tab_hrefs) != 7:
    errors.append(f'عدد تبويبات الهيدر {len(tab_hrefs)} وليس 7')

for f in sorted(ROOT.rglob('*.html')):
    if 'node_modules' in f.parts:
        continue
    rel = f.relative_to(ROOT)
    stats['pages'] += 1
    p = P()
    p.feed(f.read_text(encoding='utf-8'))
    for pr in p.problems:
        errors.append(f'{rel}: {pr}')
    if p.stack:
        errors.append(f'{rel}: وسوم غير مغلقة {p.stack}')
    is404 = rel.name == '404.html'
    depth = len(rel.parts) - 1
    want_root = '/' if is404 else '../' * depth
    for src, root, active in p.attrs_log:
        if root != want_root:
            errors.append(f'{rel}: data-root="{root}" والمتوقع "{want_root}"')
        if active not in (None, '') and active not in tab_keys:
            errors.append(f'{rel}: data-active="{active}" غير موجود في تبويبات الهيدر')
    for tag, k, ref in p.refs:
        if external(ref):
            continue
        stats['refs'] += 1
        t = target(f.parent, ref)
        if t is None:
            continue
        if k == 'data-pdf':
            if not t.parent.is_dir():
                errors.append(f'{rel}: فولدر الـPDF غير موجود -> {ref}')
        elif not t.exists():
            relt = str(t.relative_to(ROOT)).replace('\\', '/') if ROOT in t.parents else str(t)
            if relt.startswith(OPTIONAL):
                warns.append(relt)
            else:
                errors.append(f'{rel}: [{tag} {k}] رابط مكسور -> {ref}')

# ---- 2) صور content.js
content = (ROOT / 'data' / 'content.js').read_text(encoding='utf-8')
for m in re.finditer(r"photo:\s*'([^']*)'", content):
    ph = m.group(1)
    if ph and not external(ph) and not (ROOT / ph).is_file():
        errors.append(f'content.js: صورة غير موجودة -> {ph}')
if not (ROOT / 'assets/img/avatar.jpg').is_file():
    errors.append('assets/img/avatar.jpg (الصورة الافتراضية) غير موجودة')

# ---- 3) روابط url() داخل CSS
css = ROOT / 'css' / 'style.css'
for u in re.findall(r"url\(['\"]?([^)'\"]+)['\"]?\)", css.read_text(encoding='utf-8')):
    if not external(u) and not (css.parent / u).is_file():
        errors.append(f'style.css: url() مكسور -> {u}')

# ---- 4) الهيكل المتوقع: الصفوف × الفترتين × المواد + فولدر PDF لكل مادة
EXPECT = {'10': 10, '11-science': 10, '11-arts': 9, '12-science': 10, '12-arts': 9}
for g, n in EXPECT.items():
    if not (ROOT / g / 'index.html').is_file():
        errors.append(f'صفحة الصف مفقودة: {g}/index.html')
    for t in ('term1', 'term2'):
        tdir = ROOT / g / t
        if not (tdir / 'index.html').is_file():
            errors.append(f'صفحة الفترة مفقودة: {g}/{t}/index.html')
            continue
        subs = [d for d in tdir.iterdir() if d.is_dir()]
        if len(subs) != n:
            errors.append(f'{g}/{t}: عدد المواد {len(subs)} والمتوقع {n}')
        for d in subs:
            if not (d / 'index.html').is_file():
                errors.append(f'صفحة مادة مفقودة: {d.relative_to(ROOT)}/index.html')
            if not (ROOT / 'pdf' / g / t / d.name).is_dir():
                errors.append(f'فولدر PDF مفقود: pdf/{g}/{t}/{d.name}')
for need in ('index.html', 'staff/index.html', 'admin/index.html', '404.html', 'css/style.css', 'js/main.js',
             'js/header.js', 'js/footer.js', 'assets/logo.png', 'assets/emblem.png', 'assets/favicon.png'):
    if not (ROOT / need).is_file():
        errors.append(f'ملف أساسي مفقود: {need}')

# ---- النتيجة
print(f"الصفحات المفحوصة: {stats['pages']}   الروابط/الملفات المفحوصة: {stats['refs']}")
if warns:
    print(f'ملاحظة: {len(set(warns))} صورة غلاف اختيارية غير موجودة (طبيعي) — تظهر بدلاً منها الأغلفة الملونة.')
if errors:
    print(f'\nأخطاء ({len(errors)}):')
    for e in errors:
        print(' -', e)
    sys.exit(1)
print('النتيجة: لا يوجد أي رابط مكسور، والفولدرات مطابقة للهيكل المطلوب ✔')
