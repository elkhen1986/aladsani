/* عارض PDF نهائي - يستخدم iframe المتصفح نفسه اللي بيفتح الملف مظبوط
   حل مشكلة العربي المفكك نهائيا - لأن المتصفح نفسه بيرسم صح */
(function () {
  function fallback(box, url) {
    box.innerHTML = '<div class="state"><div class="ico">📄</div><h3>تعذّر عرض الملف داخل الصفحة</h3><a class="btn btn-navy" target="_blank" rel="noopener" href="'+url+'">فتح الملف في نافذة جديدة</a></div>';
  }

  function iframeViewer(box, url){
    box.innerHTML = '';
    var sc = document.createElement('div');
    sc.className = 'pdf-scroll';
    sc.style.cssText = 'position:absolute;inset:0;overflow:hidden;display:flex;flex-direction:column;';
    
    var bar = document.createElement('div');
    bar.className = 'pdf-bar';
    var pg = document.createElement('span');
    pg.textContent = 'عارض المستند';
    var open = document.createElement('a');
    open.className = 'btn btn-gold';
    open.textContent = 'فتح / تحميل';
    open.href = url;
    open.target = '_blank';
    open.rel = 'noopener';
    bar.appendChild(pg);
    bar.appendChild(open);
    
    var wrap = document.createElement('div');
    wrap.style.cssText = 'flex:1;position:relative;background:#525659;';
    
    var f = document.createElement('iframe');
    f.title = 'عارض الملف';
    // نستخدم view=FitH عشان يظبط العربي
    f.src = url + '#view=FitH';
    f.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:0;background:#fff;';
    f.onload = function(){ console.log('[Viewer] iframe loaded', url); };
    f.onerror = function(){ fallback(box, url); };
    
    wrap.appendChild(f);
    sc.appendChild(bar);
    sc.appendChild(wrap);
    box.appendChild(sc);
    
    // لو الـ iframe فشل بعد 3 ثواني (متصفحات قديمة) نحول لـ Google Docs Viewer
    setTimeout(function(){
      try {
        if(!f.contentWindow || f.contentWindow.length === 0){
          // لا نفعل شيء، بعض المتصفحات تمنع الوصول لكنها تعرض
        }
      } catch(e){
        console.log('[Viewer] iframe blocked, trying fallback');
      }
    }, 3000);
  }

  window.Viewer = {
    mount: function (box, o) {
      console.log('[Viewer] mount iframe', o.url);
      // نستخدم iframe دائما - لأنه هو اللي بيفتح http://127.0.0.1:5500/pdf/10/term1/chemistry/book.pdf مظبوط
      return iframeViewer(box, o.url);
    },
    download: async function (url, name, alt) {
      try {
        var r = await fetch(url); 
        if (!r.ok) throw 0;
        var blob = await r.blob();
        var a = document.createElement('a'); 
        a.href = URL.createObjectURL(blob); 
        a.download = name;
        document.body.appendChild(a); 
        a.click(); 
        a.remove(); 
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
      } catch (e) { 
        window.open(alt || url, '_blank', 'noopener'); 
      }
    }
  };
})();