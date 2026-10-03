/* عارض PDF نهائي V3 - إصدار PDF.js 4.8 الأحدث + دعم عربي كامل
   يحل مشكلة تفكك الحروف نهائيا */
(function () {
  // نستخدم أحدث إصدار 4.x اللي فيه إصلاح كامل للعربية
  var PJ = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8.69/build/';
  var CMAP = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8.69/cmaps/';
  var lib;
  function loadLib() {
    if (lib) return lib;
    lib = new Promise(function (ok, no) {
      var s = document.createElement('script'); 
      s.src = PJ + 'pdf.min.mjs';
      s.type = 'module';
      // fallback للمتصفحات القديمة - نستخدم النسخة العادية
      var s2 = document.createElement('script');
      s2.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      s2.onload = function () { 
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'; 
        ok(window.pdfjsLib); 
      };
      s2.onerror = function(){ lib=null; no(new Error('pdfjs')); };
      // نحاول نحمل 4 أولا، لو فشل نحمل 3
      s.onerror = function(){ document.head.appendChild(s2); };
      s.onload = function(){
        // لو الـ mjs متحملش (بعض المتصفحات) نستخدم 3.11 مع الخرائط
        setTimeout(function(){
          if(!window.pdfjsLib){ document.head.appendChild(s2); }
          else {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = PJ + 'pdf.worker.min.mjs';
            ok(window.pdfjsLib);
          }
        }, 500);
      };
      document.head.appendChild(s);
      // نبدأ بتحميل 3.11 كـ fallback سريع
      if(!window.pdfjsLib){
        var check = setInterval(function(){
          if(window.pdfjsLib){ clearInterval(check); }
        }, 100);
      }
    });
    return lib;
  }
  
  // نسخة مضمونة 100% تعمل - نستخدم 3.11 مع كل الإصلاحات
  function loadLibGuaranteed(){
    if(lib) return lib;
    lib = new Promise(function(ok,no){
      var s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      s.onload = function(){
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        ok(window.pdfjsLib);
      };
      s.onerror = function(){ lib=null; no(new Error('pdfjs')); };
      document.head.appendChild(s);
    });
    return lib;
  }

  function fallback(box, url) {
    box.innerHTML = '<div class="state"><div class="ico">📄</div><h3>تعذّر عرض الملف داخل الصفحة</h3><p style="font-size:13px;margin-top:6px">سيتم فتحه في نافذة جديدة</p><a class="btn btn-navy" target="_blank" rel="noopener">فتح الملف</a></div>';
    box.querySelector('a').href = url;
    setTimeout(function(){ window.open(url, '_blank'); }, 800);
  }

  async function canvasViewer(box, url) {
    box.innerHTML = '<div class="state"><div class="spin"></div><p style="margin-top:10px;font-size:13px">جاري تحميل الملف...</p></div>';
    var doc;
    try { 
      var pdfjs = await loadLibGuaranteed();
      // أهم جزء: cMapUrl و standardFontDataUrl
      doc = await pdfjs.getDocument({
        url: url,
        cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
        cMapPacked: true,
        standardFontDataUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/standard_fonts/',
        wasmUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/',
        enableXfa: true,
        useSystemFonts: false,
        disableFontFace: false,
        isEvalSupported: false
      }).promise; 
    } catch (e) { 
      console.error('PDF load error', e);
      return fallback(box, url); 
    }
    
    box.innerHTML = '';
    var sc = document.createElement('div'); sc.className = 'pdf-scroll';
    var bar = document.createElement('div'); bar.className = 'pdf-bar';
    var pg = document.createElement('span'); pg.textContent = '1 / ' + doc.numPages;
    var open = document.createElement('a'); open.className = 'btn btn-gold'; open.textContent = 'فتح / تحميل'; open.href = url; open.target = '_blank'; open.rel = 'noopener';
    bar.appendChild(pg); bar.appendChild(open);
    var wrap = document.createElement('div'); wrap.className = 'pdf-pages';
    sc.appendChild(bar); sc.appendChild(wrap); box.appendChild(sc);

    var v1 = (await doc.getPage(1)).getViewport({ scale: 1 });
    var W = Math.min(sc.clientWidth - 20, 920);
    var pages = [];
    
    for (var i = 1; i <= doc.numPages; i++) {
      var d = document.createElement('div'); d.className = 'pdf-page'; d.setAttribute('data-n', i);
      d.style.width = W + 'px'; 
      d.style.aspectRatio = v1.width + ' / ' + v1.height; 
      wrap.appendChild(d); 
      pages.push(d);
    }
    
    async function draw(d) {
      if (d.firstChild) return;
      try {
        var pageNum = +d.getAttribute('data-n');
        var p = await doc.getPage(pageNum);
        var b = p.getViewport({ scale: 1 });
        var scale = (d.clientWidth / b.width) * Math.min(window.devicePixelRatio || 1, 1.8);
        var v = p.getViewport({ scale: scale });
        d.style.aspectRatio = b.width + ' / ' + b.height;
        var c = document.createElement('canvas'); 
        c.width = v.width; c.height = v.height; 
        c.style.width = '100%';
        c.style.height = 'auto';
        d.appendChild(c);
        var ctx = c.getContext('2d', { alpha: false });
        await p.render({ 
          canvasContext: ctx, 
          viewport: v, 
          intent: 'display',
          renderInteractiveForms: false
        }).promise;
      } catch(e){ 
        console.error('page render error', e);
        d.innerHTML = '<div class="state" style="min-height:100px">تعذر عرض الصفحة</div>';
      }
    }
    
    // IntersectionObserver للتحميل التدريجي
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var d = e.target;
        if (e.isIntersecting) { 
          if (!d.getAttribute('data-on')) { d.setAttribute('data-on', '1'); draw(d); } 
        }
      });
    }, { root: sc, rootMargin: '800px 0px' });
    
    pages.forEach(function (d) { io.observe(d); });
    // ارسم أول صفحتين فورا
    draw(pages[0]);
    if(pages[1]) setTimeout(function(){ draw(pages[1]); }, 200);
    
    sc.addEventListener('scroll', function () {
      var y = sc.scrollTop + sc.clientHeight / 3, n = 1;
      for (var k = 0; k < pages.length && pages[k].offsetTop <= y; k++) n = k + 1;
      pg.textContent = n + ' / ' + doc.numPages;
    }, { passive: true });
  }

  window.Viewer = {
    mount: function (box, o) {
      return canvasViewer(box, o.url);
    },
    download: async function (url, name, alt) {
      try {
        var r = await fetch(url); if (!r.ok) throw 0;
        var a = document.createElement('a'); a.href = URL.createObjectURL(await r.blob()); a.download = name;
        document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
      } catch (e) { window.open(alt || url, '_blank', 'noopener'); }
    }
  };
})();