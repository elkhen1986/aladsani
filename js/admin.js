/* صفحة دخول المشرف: تسجيل الدخول/الخروج عبر /api (تعمل بعد النشر على Vercel) */
(function () {
  var box = document.getElementById('adminBox');
  var R = document.currentScript.getAttribute('data-root') || '';
  var post = function (u, b) { return fetch(u, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b || {}) }); };
  function put(html) { box.innerHTML = html; }
  function formView(msg) {
    put('<h1>دخول المشرف</h1><p>أدخل كلمة السر لإضافة الملفات وحذفها من صفحات المواد.</p>' +
      '<form id="f" autocomplete="off"><label class="field">كلمة السر<input type="password" id="pw" required autofocus></label>' +
      '<p class="err" role="alert">' + (msg || '') + '</p><button class="btn btn-navy" type="submit">دخول</button></form>');
    document.getElementById('f').onsubmit = async function (e) {
      e.preventDefault();
      var btn = e.target.querySelector('button'); btn.disabled = true;
      try {
        var r = await post('/api/login', { password: document.getElementById('pw').value });
        if (r.ok) return inView();
        var j = {}; try { j = await r.json(); } catch (x) {}
        formView(j.error === 'not_configured' ? 'لم تُضبط كلمة السر على الخادم بعد (راجع README).' : 'كلمة السر غير صحيحة.');
      } catch (x) { formView('تعذّر الاتصال بالخادم.'); }
    };
  }
  function inView() {
    put('<h1>أنت مسجّل كمشرف</h1><p>افتح أي مادة ثم تبويب «اختبارات قصيرة» أو «اختبارات نهاية الفترة»، وستجد بطاقة «إضافة ملف جديد» وزر الحذف.</p>' +
      '<a class="btn btn-navy" href="' + R + 'index.html">الذهاب للرئيسية</a><button class="btn btn-ghost" id="out" type="button">تسجيل الخروج</button>');
    document.getElementById('out').onclick = async function () { try { await post('/api/logout'); } catch (x) {} formView(); };
  }
  function offView() {
    put('<h1>الخادم غير متاح</h1><p>تسجيل الدخول يعمل بعد نشر الموقع على Vercel. أثناء التجربة محلياً (VS Code) تظهر إضافة الملفات تلقائياً بوضع معاينة تجريبي داخل صفحات المواد.</p>' +
      '<a class="btn btn-navy" href="' + R + 'index.html">الذهاب للرئيسية</a>');
  }
  (async function () {
    try {
      var r = await fetch('/api/session', { credentials: 'same-origin', cache: 'no-store' });
      if (!r.ok) throw 0;
      (await r.json()).admin ? inView() : formView();
    } catch (e) { offView(); }
  })();
})();
