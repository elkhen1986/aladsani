/* أغلفة المواد الاختيارية: تُحمَّل الصورة فقط للمواد المذكورة في SITE.covers (data/content.js) */
(function () {
  var R = document.currentScript.getAttribute('data-root') || '', L = (window.SITE && window.SITE.covers) || [];
  document.querySelectorAll('.subj[data-s]').forEach(function (a) {
    var s = a.getAttribute('data-s'); if (L.indexOf(s) < 0) return;
    var i = document.createElement('img'); i.alt = ''; i.loading = 'lazy';
    i.onerror = function () { i.remove(); }; i.src = R + 'assets/img/subjects/' + s + '.jpg';
    a.querySelector('.cover').appendChild(i);
  });
})();
