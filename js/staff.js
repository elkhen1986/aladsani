/* صفحة الهيئة التعليمية: المدير في المنتصف ومساعداه على الجانبين، ثم الأقسام - معدل: بدون زر رئيس القسم + بطاقات قابلة للضغط */
(function () {
  var S = window.SITE, R = document.currentScript.getAttribute('data-root') || '';
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var src = function (p) { return !p ? R + 'assets/img/avatar.jpg' : (/^(https?:)?\/\//.test(p) ? p : R + p); };
  var fb = ' onerror="this.onerror=null;this.src=\'' + R + 'assets/img/avatar.jpg\'"';

  var L = S.leaders, row = [L[1], L[0], L[2]];
  document.getElementById('leadRow').innerHTML = row.map(function (p) {
    var main = p === L[0];
    return '<article class="person ' + (main ? 'main-p' : 'side') + '"><div class="p-media"><img src="' + esc(src(p.photo)) + '" alt="' + esc(p.name) + '"' + fb + '></div>' +
      '<div class="p-body"><span class="role' + (main ? '' : ' gold') + '">' + esc(p.role) + '</span><h3>' + esc(p.name) + '</h3></div></article>';
  }).join('');

  // رسم الأقسام بدون زر رئيس القسم
  document.getElementById('depts').innerHTML = S.departments.map(function (d, di) {
    var h = d.head;
    return '<section class="dept"><h2 class="dept-title">' + esc(d.name) + '</h2><div class="dept-grid">' +
      '<article class="head-card"><div class="hm"><img src="' + esc(src(h.photo)) + '" alt="' + esc(h.name) + '" loading="lazy"' + fb + '></div>' +
      '<div class="hb"><h3>' + esc(h.name) + '</h3><p>' + esc(h.bio || '') + '</p></div></article>' +
      '<div class="teachers">' + d.teachers.map(function (t, ti) {
        return '<article class="t-card" data-dept="' + di + '" data-teacher="' + ti + '" tabindex="0" role="button" aria-label="عرض ' + esc(t.name) + '"><img src="' + esc(src(t.photo)) + '" alt="' + esc(t.name) + '" loading="lazy"' + fb + '><b>' + esc(t.name) + '</b><small>' + esc(t.subject || '') + '</small></article>';
      }).join('') + '</div></div></section>';
  }).join('');

  // مودال تكبير بطاقة المعلم
  var modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'teacherModal';
  modal.innerHTML = '<div class="m-box lb" role="dialog" aria-modal="true" style="max-width:420px;text-align:center;"><button type="button" class="m-x" aria-label="إغلاق">✕</button><img id="tLbImg" style="width:110px;height:110px;border-radius:50%;object-fit:cover;margin:0 auto 14px;border:4px solid var(--gold-2);display:block;" alt=""><h3 id="tLbName"></h3><p id="tLbSub" style="color:var(--muted);font-weight:700;margin-top:4px;"></p><p id="tLbBio" style="color:var(--muted);margin-top:10px;font-size:14px;line-height:1.7;"></p></div>';
  document.body.appendChild(modal);
  
  var lbImg = document.getElementById('tLbImg');
  var lbName = document.getElementById('tLbName');
  var lbSub = document.getElementById('tLbSub');
  var lbBio = document.getElementById('tLbBio');
  
  function openTeacher(di, ti){
    var t = S.departments[di] && S.departments[di].teachers[ti];
    if(!t) return;
    var photo = t.photo ? src(t.photo) : R + 'assets/img/avatar.jpg';
    lbImg.src = photo;
    lbImg.style.display = 'block';
    lbName.textContent = t.name || '';
    lbSub.textContent = t.subject || '';
    lbBio.textContent = t.bio || '';
    lbBio.style.display = t.bio ? 'block' : 'none';
    modal.classList.add('open');
  }
  
  function closeModal(){ modal.classList.remove('open'); }
  
  modal.querySelector('.m-x').onclick = closeModal;
  modal.onclick = function(e){ if(e.target===modal) closeModal(); };
  document.addEventListener('keydown', function(e){ if(e.key==='Escape') closeModal(); });
  
  // ربط الضغط
  document.getElementById('depts').addEventListener('click', function(e){
    var card = e.target.closest('.t-card');
    if(card){
      var di = parseInt(card.getAttribute('data-dept'));
      var ti = parseInt(card.getAttribute('data-teacher'));
      openTeacher(di, ti);
    }
  });
  
  document.getElementById('depts').addEventListener('keydown', function(e){
    if(e.key==='Enter' || e.key===' '){
      var card = e.target.closest('.t-card');
      if(card){
        e.preventDefault();
        var di = parseInt(card.getAttribute('data-dept'));
        var ti = parseInt(card.getAttribute('data-teacher'));
        openTeacher(di, ti);
      }
    }
  });
})();