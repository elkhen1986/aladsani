/* =====================================================================
   الصفحة الرئيسية - تصميم جديد: سطر واحد المدير في النص مرفوع بإطار ذهبي
   ===================================================================== */
(function () {
  var S = window.SITE, R = document.currentScript.getAttribute('data-root') || '';
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var src = function (p) { return /^(https?:)?\/\//.test(p) ? p : R + p; };
  var fb = ' onerror="this.onerror=null;this.src=\'' + R + 'assets/img/avatar.jpg\'"';

  /* كلمة الإدارة - سطر واحد */
  var renderPerson = function(p, isPrincipal){
    return '<article class="person' + (isPrincipal ? ' principal' : '') + '"><div class="p-media"><img src="' + esc(src(p.photo)) + '" alt="' + esc(p.name) + '" loading="lazy"' + fb + '></div>' +
      '<div class="p-body"><span class="role' + (isPrincipal ? ' principal-role' : ' gold') + '">' + esc(p.role) + '</span><h3>' + esc(p.name) + '</h3></div></article>';
  };

  if(S.leaders && S.leaders.length){
    var principal = S.leaders[0];
    var vices = S.leaders.slice(1);
    // الترتيب المطابق للصورة: الإداري يسار - المدير وسط - التعليمي يمين
    var ordered = [];
    if(vices.length >= 2){
      ordered = [vices[1], principal, vices[0]]; // طارق - فهد - وليد
    }else{
      ordered = S.leaders;
    }
    $('leaders').innerHTML = ordered.map(function(p){
      return renderPerson(p, p === principal);
    }).join('');
  }

  /* لوحة الشرف: معرض صور بصف واحد وسهمين */
  var track = $('track'), prev = $('prev'), next = $('next');
  if(track){
    track.innerHTML = S.honor.map(function (h, i) {
      return '<button type="button" class="h-card" data-i="' + i + '"><img src="' + esc(src(h.photo)) + '" alt="' + esc(h.name) + '" loading="lazy"' + fb + '>' +
        '<span class="h-meta"><span><b>' + esc(h.name) + '</b><small>' + esc(h.grade) + '</small></span><span class="score">' + esc(h.score) + '</span></span></button>';
    }).join('');
    function sync() {
      var pos = Math.abs(track.scrollLeft), max = track.scrollWidth - track.clientWidth - 2;
      prev.disabled = pos <= 8; next.disabled = pos >= max - 6;
    }
    function step() { return Math.max(260, track.clientWidth * 0.8); }
    prev.addEventListener('click', function () { track.scrollBy({ left: step(), behavior: 'smooth' }); });
    next.addEventListener('click', function () { track.scrollBy({ left: -step(), behavior: 'smooth' }); });
    track.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    sync();
  }

  /* تكبير صورة الطالب */
  var lb = $('lightbox');
  if(track && lb){
    track.addEventListener('click', function (e) {
      var c = e.target.closest('.h-card'); if (!c) return;
      var h = S.honor[+c.getAttribute('data-i')];
      lb.querySelector('img').src = src(h.photo); lb.querySelector('img').alt = h.name;
      lb.querySelector('h3').textContent = h.name; lb.querySelector('p').textContent = h.grade + ' - ' + h.score;
      lb.classList.add('open');
    });
    lb.addEventListener('click', function (e) { if (e.target === lb || e.target.closest('.m-x')) lb.classList.remove('open'); });
  }

  /* من نحن + ماذا نقدم */
  var a = S.about;
  if($('about-text')){
    $('about-text').innerHTML = '<h2 class="sec-title">' + esc(a.title) + '</h2><p>' + esc(a.text) + '</p>' +
      '<div class="stat"><div class="n">' + esc(a.stat.number) + '</div><div><b>' + esc(a.stat.title) + '</b><span>' + esc(a.stat.text) + '</span></div></div>';
  }
  if($('offers-head')){
    $('offers-head').innerHTML = '<h2 class="sec-title">' + esc(S.offersTitle) + '</h2><p class="sec-sub">' + esc(S.offersSub) + '</p>';
  }
  if($('offers')){
    $('offers').innerHTML = S.offers.map(function (o) {
      return '<div class="offer"><div class="o-ico">' + esc(o.icon) + '</div><h4>' + esc(o.title) + '</h4><p>' + esc(o.text) + '</p></div>';
    }).join('');
  }
})();