/* الهيدر الموحّد — يظهر بنفس الشكل في كل الصفحات.
   لتعديل التبويبات السبعة عدّل المصفوفة TABS فقط (المسارات نسبة لجذر الموقع). */
(function () {
  var s = document.currentScript;
  var R = s.getAttribute('data-root') || '';
  var A = s.getAttribute('data-active') || '';
  var TABS = [
    { k: 'home',       t: 'الرئيسية',          href: 'index.html' },
    { k: '10',         t: 'العاشر',            href: '10/index.html' },
    { k: '11-science', t: 'الحادي عشر علمي',   href: '11-science/index.html' },
    { k: '11-arts',    t: 'الحادي عشر أدبي',   href: '11-arts/index.html' },
    { k: '12-science', t: 'الثاني عشر علمي',   href: '12-science/index.html' },
    { k: '12-arts',    t: 'الثاني عشر أدبي',   href: '12-arts/index.html' },
    { k: 'staff',      t: 'الهيئة التعليمية',  href: 'staff/index.html' }
  ];
  function links() {
    return TABS.map(function (x) {
      var on = x.k === A;
      return '<a href="' + R + x.href + '"' + (on ? ' class="is-active" aria-current="page"' : '') + '>' + x.t + '</a>';
    }).join('');
  }
  s.insertAdjacentHTML('beforebegin',
    '<header class="site-header" id="siteHeader"><div class="wrap">' +
      '<a class="brand" href="' + R + 'index.html" aria-label="الصفحة الرئيسية">' +
        '<img src="' + R + 'assets/emblem.png" alt="شعار المدرسة">' +
        '<span><b>مدرسة عبدالرزاق محمد صالح العدساني</b><small>الثانوية - بنين</small></span>' +
      '</a>' +
      '<nav class="nav" aria-label="التنقل الرئيسي">' + links() + '</nav>' +
      '<button class="burger" type="button" aria-label="فتح القائمة" aria-expanded="false">☰</button>' +
    '</div><nav class="mnav" aria-label="قائمة الجوال">' + links() + '</nav></header>');
  var h = document.getElementById('siteHeader'), b = h.querySelector('.burger');
  b.addEventListener('click', function () {
    var open = h.classList.toggle('open');
    b.setAttribute('aria-expanded', open ? 'true' : 'false');
    b.textContent = open ? '✕' : '☰';
  });
})();
