/* صفحة الهيئة التعليمية: المدير في المنتصف ومساعداه على الجانبين، ثم الأقسام */
(function () {
  var S = window.SITE, R = document.currentScript.getAttribute('data-root') || '';
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var src = function (p) { return !p ? R + 'assets/img/avatar.jpg' : (/^(https?:)?\/\//.test(p) ? p : R + p); };
  var fb = ' onerror="this.onerror=null;this.src=\'' + R + 'assets/img/avatar.jpg\'"';

  var L = S.leaders, row = [L[1], L[0], L[2]];            /* يمين: مساعد 1 — وسط: المدير — يسار: مساعد 2 */
  document.getElementById('leadRow').innerHTML = row.map(function (p) {
    var main = p === L[0];
    return '<article class="person ' + (main ? 'main-p' : 'side') + '"><div class="p-media"><img src="' + esc(src(p.photo)) + '" alt="' + esc(p.name) + '"' + fb + '></div>' +
      '<div class="p-body"><span class="role' + (main ? '' : ' gold') + '">' + esc(p.role) + '</span><h3>' + esc(p.name) + '</h3></div></article>';
  }).join('');

  document.getElementById('depts').innerHTML = S.departments.map(function (d) {
    var h = d.head;
    return '<section class="dept"><h2 class="dept-title">' + esc(d.name) + '</h2><div class="dept-grid">' +
      '<article class="head-card"><div class="hm"><img src="' + esc(src(h.photo)) + '" alt="' + esc(h.name) + '" loading="lazy"' + fb + '></div>' +
      '<div class="hb"><span class="role">رئيس القسم</span><h3>' + esc(h.name) + '</h3><p>' + esc(h.bio || '') + '</p></div></article>' +
      '<div class="teachers">' + d.teachers.map(function (t) {
        return '<article class="t-card"><img src="' + esc(src(t.photo)) + '" alt="' + esc(t.name) + '" loading="lazy"' + fb + '><b>' + esc(t.name) + '</b><small>' + esc(t.subject || '') + '</small></article>';
      }).join('') + '</div></div></section>';
  }).join('');
})();
