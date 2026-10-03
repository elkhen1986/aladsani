/* صفحة المادة: 4 تبويبات
   - كتاب الطالب / بنك الأسئلة: ملف PDF واحد يُعرض مباشرة (pdf/<الصف>/<الفترة>/<المادة>/book.pdf و qbank.pdf)
   - اختبارات قصيرة / اختبارات نهاية الفترة: قائمة ملفات (عرض + تحميل)، والمشرف يضيف ويحذف */
(function () {
  var M = document.getElementById('subject'), D = {
    grade: M.getAttribute('data-grade'), term: M.getAttribute('data-term'), subject: M.getAttribute('data-subject'),
    title: M.getAttribute('data-title'), pdf: M.getAttribute('data-pdf')
  };
  var panel = document.getElementById('panel');
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.tab'));
  var LABEL = { book: 'كتاب الطالب', qbank: 'بنك الأسئلة', quizzes: 'اختبارات قصيرة', exams: 'اختبارات نهاية الفترة' };
  var local = location.protocol === 'file:' || /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  var st = { admin: false, preview: false, files: null }, seq = 0;
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var SPIN = '<div class="state"><div class="spin"></div></div>';

  /* هل المستخدم مشرف؟ محلياً (بدون API) تُفعَّل المعاينة التجريبية */
  var ready = (async function () {
    try {
      var r = await fetch('/api/session', { credentials: 'same-origin', cache: 'no-store' });
      if (!r.ok) throw 0;
      st.admin = !!(await r.json()).admin;
    } catch (e) { if (local) { st.preview = true; st.admin = true; } }
  })();

  /* ---------- تبويبا الملف الواحد ---------- */
  async function exists(url) { try { return (await fetch(url, { method: 'HEAD' })).ok; } catch (e) { return null; } }
  async function showStatic(tab, my) {
    panel.innerHTML = SPIN;
    var url = D.pdf + (tab === 'book' ? 'book.pdf' : 'qbank.pdf'), ok = await exists(url);
    if (my !== seq) return;
    if (ok === false) {
      panel.innerHTML = '<div class="state"><div class="ico">📂</div><h3>لم يُرفع ' + LABEL[tab] + ' بعد</h3><p>سيظهر هنا فور إضافة الملف.</p></div>';
      return;
    }
    panel.innerHTML = '<div class="v-body"></div>';
    Viewer.mount(panel.firstChild, { url: url, name: D.title + ' - ' + LABEL[tab] });
  }

  /* ---------- تبويبا القوائم ---------- */
  function fmtSize(n) { return n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round((n || 0) / 1024)) + ' KB'; }
  function fmtDate(t) { try { return new Date(t).toLocaleDateString('ar-u-nu-latn', { year: 'numeric', month: 'long', day: 'numeric' }); } catch (e) { return ''; } }
  async function loadFiles() {
    if (st.files) return st.files;
    var all = [];
    if (!st.preview) {
      try {
        var r = await fetch('/api/files' + (st.admin ? '?t=' + Date.now() : ''), { credentials: 'same-origin' });
        if (r.ok) all = await r.json();
      } catch (e) { /* لا توجد ملفات */ }
    }
    st.files = all.filter(function (f) { return f.grade === D.grade && f.term === D.term && f.subject === D.subject; });
    return st.files;
  }
  function card(f, i) {
    return '<article class="f-card"><span class="f-ico">PDF</span><div class="f-info"><h4>' + esc(f.title) + '</h4>' +
      '<p class="f-meta"><span>' + esc(fmtDate(f.uploadedAt)) + '</span><span dir="ltr">' + fmtSize(f.size) + '</span></p></div>' +
      '<div class="f-act"><button type="button" class="btn btn-navy btn-sm" data-act="view" data-i="' + i + '">عرض</button>' +
      '<button type="button" class="btn btn-gold btn-sm" data-act="dl" data-i="' + i + '">تحميل</button>' +
      (st.admin ? '<button type="button" class="btn btn-danger btn-sm" data-act="del" data-i="' + i + '">حذف</button>' : '') + '</div></article>';
  }
  async function showList(kind, my) {
    panel.innerHTML = SPIN;
    await ready; var all = await loadFiles();
    if (my !== seq) return;
    var items = all.filter(function (f) { return f.kind === kind; })
                   .sort(function (a, b) { return new Date(a.uploadedAt) - new Date(b.uploadedAt); });
    var h = '';
    if (st.preview) h += '<div class="note">معاينة محلية: الرفع هنا تجريبي ولا يُحفظ. بعد النشر على Vercel وتسجيل دخول المشرف يُحفظ الملف فعلياً.</div>';
    h += items.map(card).join('');
    if (!items.length) h += '<div class="state" style="min-height:170px"><div class="ico">🗂️</div><h3>لا توجد ملفات بعد</h3><p>ستظهر الملفات هنا فور إضافتها.</p></div>';
    if (st.admin) h += '<button type="button" class="add-card" data-act="add"><span class="plus">+</span>إضافة ملف جديد</button>';
    panel.innerHTML = '<div class="p-scroll"><div class="files">' + h + '</div></div>';
    panel.querySelector('.files').onclick = function (e) {
      var b = e.target.closest('[data-act]'); if (!b) return;
      var act = b.getAttribute('data-act'), f = items[+b.getAttribute('data-i')];
      if (act === 'view') view(f, kind);
      else if (act === 'dl') Viewer.download(f.url, f.title + '.pdf', f.downloadUrl);
      else if (act === 'del') remove(f, kind);
      else if (act === 'add') openUpload(kind);
    };
  }
  function view(f, kind) {
    panel.innerHTML = '<div class="v-head"><button type="button" class="btn btn-ghost btn-sm" data-back>رجوع للقائمة</button><b>' + esc(f.title) +
      '</b><button type="button" class="btn btn-gold btn-sm" data-dl>تحميل</button></div><div class="v-body"></div>';
    panel.querySelector('[data-back]').onclick = function () { show(kind); };
    panel.querySelector('[data-dl]').onclick = function () { Viewer.download(f.url, f.title + '.pdf', f.downloadUrl); };
    Viewer.mount(panel.querySelector('.v-body'), { url: f.url, name: f.title });
  }
  async function remove(f, kind) {
    if (!confirm('حذف الملف «' + f.title + '» نهائياً؟')) return;
    try {
      if (!st.preview) {
        var r = await fetch('/api/delete', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: f.url }) });
        if (!r.ok) throw 0;
      }
      st.files = st.files.filter(function (x) { return x.url !== f.url; });
      toast('تم حذف الملف'); show(kind);
    } catch (e) { toast('تعذّر الحذف، حاول مرة أخرى'); }
  }

  /* ---------- نافذة إضافة ملف جديد (للمشرف فقط) ---------- */
  var modal, file, curKind;
  function b64u(s) {
    var bin = ''; new TextEncoder().encode(s).forEach(function (b) { bin += String.fromCharCode(b); });
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  async function send(kind, title, f, onp) {
    var item = { grade: D.grade, term: D.term, subject: D.subject, kind: kind, title: title, size: f.size, uploadedAt: new Date().toISOString() };
    if (st.preview) {                                   /* معاينة محلية بدون خادم */
      for (var i = 1; i <= 10; i++) { await new Promise(function (r) { setTimeout(r, 70); }); onp(i * 10); }
      item.url = URL.createObjectURL(f); return item;
    }
    /* رفع مباشر من المتصفح إلى Vercel Blob (يتجاوز حد 4.5MB لدوال Vercel) */
    var path = 'files/' + D.grade + '/' + D.term + '/' + D.subject + '/' + kind + '/' + Date.now() + '_' + b64u(title) + '.pdf';
    var mod = await import('https://esm.sh/@vercel/blob@2/client');
    var blob = await mod.upload(path, f, { access: 'public', handleUploadUrl: '/api/upload', multipart: f.size > 25 * 1048576, onUploadProgress: function (p) { onp(p.percentage); } });
    item.url = blob.url; item.downloadUrl = blob.downloadUrl; return item;
  }
  function buildModal() {
    modal = document.createElement('div'); modal.className = 'modal';
    modal.innerHTML = '<div class="m-box" role="dialog" aria-modal="true" aria-labelledby="upT"><button type="button" class="m-x" aria-label="إغلاق">✕</button>' +
      '<h3 id="upT">إضافة ملف جديد</h3>' +
      '<label class="field">اسم الملف<input type="text" id="upName" maxlength="80" placeholder="مثال: اختبار الوحدة الأولى"></label>' +
      '<div class="drop" id="upDrop" tabindex="0" role="button">اضغط لاختيار ملف PDF أو اسحبه إلى هنا<input type="file" id="upFile" accept="application/pdf,.pdf" hidden></div>' +
      '<div class="bar" id="upBar"><i></i></div><p class="err" id="upErr" role="alert"></p>' +
      '<div class="m-act"><button type="button" class="btn btn-navy" id="upGo">رفع الملف</button><button type="button" class="btn btn-ghost" data-x>إلغاء</button></div></div>';
    document.body.appendChild(modal);
    var $ = function (id) { return modal.querySelector('#' + id); };
    var drop = $('upDrop'), input = $('upFile'), name = $('upName'), bar = $('upBar'), go = $('upGo');
    var err = function (m) { $('upErr').textContent = m || ''; };
    function pick(f) {
      file = f || null; err(''); drop.classList.toggle('has', !!file);
      drop.firstChild.textContent = file ? file.name + ' (' + fmtSize(file.size) + ')' : 'اضغط لاختيار ملف PDF أو اسحبه إلى هنا';
      if (file && !name.value.trim()) name.value = file.name.replace(/\.pdf$/i, '');
    }
    name.oninput = function () { err(''); };
    drop.onclick = function () { input.click(); };
    drop.onkeydown = function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); } };
    input.onchange = function () { pick(input.files[0]); };
    drop.ondragover = function (e) { e.preventDefault(); };
    drop.ondrop = function (e) { e.preventDefault(); pick(e.dataTransfer.files[0]); };
    modal.onclick = function (e) { if (e.target === modal || e.target.closest('.m-x') || e.target.closest('[data-x]')) modal.classList.remove('open'); };
    go.onclick = async function () {
      var title = name.value.trim();
      if (title.length < 2) return err('اكتب اسم الملف (حرفان على الأقل).');
      if (!file) return err('اختر ملف PDF أولاً.');
      if (file.type !== 'application/pdf' && !/\.pdf$/i.test(file.name)) return err('الملف يجب أن يكون بصيغة PDF.');
      if (file.size > 50 * 1048576) return err('حجم الملف أكبر من 50 ميغابايت.');
      err(''); go.disabled = true; bar.style.display = 'block'; bar.firstChild.style.width = '0%';
      try {
        var item = await send(curKind, title, file, function (p) { bar.firstChild.style.width = p + '%'; });
        await loadFiles(); st.files.push(item);
        modal.classList.remove('open'); toast('تم رفع الملف بنجاح'); show(curKind);
      } catch (e) { err('تعذّر الرفع. تأكد أنك مسجّل كمشرف (صفحة /admin) وأن الملف PDF أقل من 50 ميغابايت.'); }
      go.disabled = false;
    };
    modal.reset = function () { pick(null); name.value = ''; err(''); bar.style.display = 'none'; input.value = ''; };
  }
  function openUpload(kind) {
    if (!modal) buildModal();
    curKind = kind; modal.reset(); modal.classList.add('open');
    modal.querySelector('#upName').focus();
  }

  /* ---------- التبويبات ---------- */
  function show(tab, push) {
    var my = ++seq;
    tabs.forEach(function (t) { var on = t.getAttribute('data-tab') === tab; t.classList.toggle('is-active', on); t.setAttribute('aria-selected', on ? 'true' : 'false'); });
    if (push) history.replaceState(null, '', '#' + tab);
    if (tab === 'book' || tab === 'qbank') showStatic(tab, my); else showList(tab, my);
  }
  tabs.forEach(function (t) { t.addEventListener('click', function () { show(t.getAttribute('data-tab'), true); }); });
  var h = location.hash.slice(1);
  show(['book', 'qbank', 'quizzes', 'exams'].indexOf(h) > -1 ? h : 'book');
})();
