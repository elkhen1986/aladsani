/* عارض PDF: iframe على الكمبيوتر، وعارض pdf.js داخل الصفحة على الجوال والتابلت
   (متصفحات الجوال لا تعرض PDF داخل iframe بشكل كامل). */
(function () {
  var PJ = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/';
  var mobile = matchMedia('(pointer:coarse)').matches || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
               (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var lib;
  function loadLib() {
    if (lib) return lib;
    lib = new Promise(function (ok, no) {
      var s = document.createElement('script'); s.src = PJ + 'pdf.min.js';
      s.onload = function () { window.pdfjsLib.GlobalWorkerOptions.workerSrc = PJ + 'pdf.worker.min.js'; ok(window.pdfjsLib); };
      s.onerror = function () { lib = null; no(new Error('pdfjs')); };
      document.head.appendChild(s);
    });
    return lib;
  }
  function fallback(box, url) {
    box.innerHTML = '<div class="state"><div class="ico">📄</div><h3>تعذّر عرض الملف داخل الصفحة</h3><a class="btn btn-navy" target="_blank" rel="noopener">فتح الملف في نافذة جديدة</a></div>';
    box.querySelector('a').href = url;
  }
  async function canvasViewer(box, url) {
    box.innerHTML = '<div class="state"><div class="spin"></div></div>';
    var doc;
    try { doc = await (await loadLib()).getDocument(url).promise; } catch (e) { return fallback(box, url); }
    box.innerHTML = '';
    var sc = document.createElement('div'); sc.className = 'pdf-scroll';
    var bar = document.createElement('div'); bar.className = 'pdf-bar';
    var pg = document.createElement('span'); pg.textContent = '1 / ' + doc.numPages;
    var open = document.createElement('a'); open.className = 'btn btn-gold'; open.textContent = 'فتح / تحميل'; open.href = url; open.target = '_blank'; open.rel = 'noopener';
    bar.appendChild(pg); bar.appendChild(open);
    var wrap = document.createElement('div'); wrap.className = 'pdf-pages';
    sc.appendChild(bar); sc.appendChild(wrap); box.appendChild(sc);

    var v1 = (await doc.getPage(1)).getViewport({ scale: 1 }), W = Math.min(sc.clientWidth - 20, 920), pages = [];
    for (var i = 1; i <= doc.numPages; i++) {
      var d = document.createElement('div'); d.className = 'pdf-page'; d.setAttribute('data-n', i);
      d.style.width = W + 'px'; d.style.aspectRatio = v1.width + ' / ' + v1.height; wrap.appendChild(d); pages.push(d);
    }
    async function draw(d) {
      var p = await doc.getPage(+d.getAttribute('data-n')), b = p.getViewport({ scale: 1 });
      var v = p.getViewport({ scale: (d.clientWidth / b.width) * Math.min(window.devicePixelRatio || 1, 2.5) });
      if (!d.getAttribute('data-on') || d.firstChild) return;
      d.style.aspectRatio = b.width + ' / ' + b.height;
      var c = document.createElement('canvas'); c.width = v.width; c.height = v.height; d.appendChild(c);
      p.render({ canvasContext: c.getContext('2d'), viewport: v });
    }
    /* يرسم الصفحات القريبة فقط ويفرّغ البعيدة لتوفير ذاكرة الجوال */
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var d = e.target;
        if (e.isIntersecting) { if (!d.getAttribute('data-on')) { d.setAttribute('data-on', '1'); draw(d); } }
        else if (d.getAttribute('data-on')) { d.removeAttribute('data-on'); d.innerHTML = ''; }
      });
    }, { root: sc, rootMargin: '1400px 0px' });
    pages.forEach(function (d) { io.observe(d); });
    sc.addEventListener('scroll', function () {
      var y = sc.scrollTop + sc.clientHeight / 3, n = 1;
      for (var k = 0; k < pages.length && pages[k].offsetTop <= y; k++) n = k + 1;
      pg.textContent = n + ' / ' + doc.numPages;
    }, { passive: true });
  }
  window.Viewer = {
    mount: function (box, o) {
      if (mobile) return canvasViewer(box, o.url);
      var f = document.createElement('iframe'); f.title = o.name || 'عارض الملف'; f.src = o.url + '#view=FitH';
      box.innerHTML = ''; box.appendChild(f);
    },
    /* تحميل باسم عربي واضح؛ وإن فشل (CORS) يفتح الرابط المباشر */
    download: async function (url, name, alt) {
      try {
        var r = await fetch(url); if (!r.ok) throw 0;
        var a = document.createElement('a'); a.href = URL.createObjectURL(await r.blob()); a.download = name;
        document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
      } catch (e) { window.open(alt || url, '_blank', 'noopener'); }
    }
  };
})();
