/* وظائف مشتركة لكل الصفحات */
(function () {
  // على الاستضافة: إخفاء index.html من الرابط الظاهر (شكلي فقط)
  if (/^https?:$/.test(location.protocol) && /\/index\.html$/.test(location.pathname)) {
    history.replaceState(null, '', location.pathname.replace(/index\.html$/, '') + location.search + location.hash);
  }
  // إشعار قصير أسفل الشاشة: toast('رسالة')
  var timer;
  window.toast = function (msg) {
    var el = document.getElementById('toast');
    if (!el) {
      el = document.createElement('div'); el.id = 'toast'; el.className = 'toast';
      el.setAttribute('role', 'status'); document.body.appendChild(el);
    }
    el.textContent = msg; el.classList.add('show');
    clearTimeout(timer); timer = setTimeout(function () { el.classList.remove('show'); }, 3200);
  };
  // إغلاق قائمة "مواد الثاني عشر" عند الضغط خارجها
  document.addEventListener('click', function (e) {
    document.querySelectorAll('.menu[open]').forEach(function (m) { if (!m.contains(e.target)) m.removeAttribute('open'); });
  });
  // Esc يغلق أي نافذة منبثقة
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') document.querySelectorAll('.modal.open').forEach(function (m) { m.classList.remove('open'); });
  });
})();
