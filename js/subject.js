/* صفحة المادة - تحكم كامل: سحب وإفلات ترتيب الملفات + تحكم في التبويبات + مواد + دعم متعدد الأنواع + عرض مباشر موبايل */
(function () {
  var M = document.getElementById('subject'), D = {
    grade: M.getAttribute('data-grade'), term: M.getAttribute('data-term'), subject: M.getAttribute('data-subject'),
    title: M.getAttribute('data-title'), pdf: M.getAttribute('data-pdf')
  };
  var panel = document.getElementById('panel');
  var tabsBar = document.querySelector('.tabs');
  var isEnglish = /english|انجليز/i.test(D.subject) || /english|انجليز/i.test(D.title);
  var isArabic = /arabic|عربي/i.test(D.subject) || /عربي/i.test(D.title);
  var isMathStats = /math|رياض|إحصاء|احصاء|stat/i.test(D.subject) || /رياض|إحصاء|احصاء/i.test(D.title);
  var isSenior = /^(11|12)$/.test(String(D.grade)) || /حادي عشر|ثاني عشر|11|12/.test(String(D.grade));
  var isGrade12 = /^12/.test(String(D.grade));
  var isMathSenior = isMathStats && isSenior;
  var isChem = /chem|كيميا|كيمياء/i.test(D.subject) || /كيميا|كيمياء/i.test(D.title);
  var isPhys = /phys|فيزيا|فيزياء/i.test(D.subject) || /فيزيا|فيزياء/i.test(D.title);
  var isBio = /bio|احياء|أحياء|biology/i.test(D.subject) || /احياء|أحياء|biology/i.test(D.title);
  var isGeo = /geo|جيولوجيا/i.test(D.subject) || /جيولوجيا/i.test(D.title);
  var isScience = isChem || isPhys || isBio || isGeo;
  var isScienceSenior = isScience && isSenior;
  var DEFAULT_LABEL;
  if(isEnglish){
    DEFAULT_LABEL = { book: "Student's Book", workbook: 'Workbook', qbank: 'بنك الأسئلة', worksheets: 'أوراق عمل', quizzes: 'اختبارات قصيرة', exams: 'اختبارات نهاية الفترة' };
  } else if(isArabic){
    if(isGrade12){
      DEFAULT_LABEL = { book: 'كتاب الطالب', nahw: 'قواعد النحو والصرف', qbank: 'بنك الأسئلة', worksheets: 'أوراق عمل', quizzes: 'اختبارات قصيرة', exams: 'اختبارات نهاية الفترة' };
    } else {
      DEFAULT_LABEL = { book: 'كتاب الطالب', nahw: 'قواعد النحو والصرف', balagha: 'فنون البلاغة', qbank: 'بنك الأسئلة', worksheets: 'أوراق عمل', quizzes: 'اختبارات قصيرة', exams: 'اختبارات نهاية الفترة' };
    }
  } else if(isMathSenior){
    DEFAULT_LABEL = { book: 'كتاب الطالب', exercises: 'كتاب التمارين', qbank: 'بنك الأسئلة', worksheets: 'أوراق عمل', quizzes: 'اختبارات قصيرة', exams: 'اختبارات نهاية الفترة' };
  } else if(isScienceSenior){
    DEFAULT_LABEL = { book: 'كتاب الطالب', applications: 'كراسة التطبيقات', qbank: 'بنك الأسئلة', worksheets: 'أوراق عمل', quizzes: 'اختبارات قصيرة', exams: 'اختبارات نهاية الفترة' };
  } else {
    DEFAULT_LABEL = { book: 'كتاب الطالب', qbank: 'بنك الأسئلة', worksheets: 'أوراق عمل', quizzes: 'اختبارات قصيرة', exams: 'اختبارات نهاية الفترة' };
  }

  var FILE_TYPES = {
    pdf: { icon: '📄', label: 'PDF' },
    html: { icon: '🌐', label: 'HTML' },
    htm: { icon: '🌐', label: 'HTML' },
    jpg: { icon: '🖼️', label: 'IMG' },
    jpeg:{ icon: '🖼️', label: 'IMG' },
    png: { icon: '🖼️', label: 'IMG' },
    gif: { icon: '🖼️', label: 'IMG' },
    webp:{ icon: '🖼️', label: 'IMG' },
    doc: { icon: '📝', label: 'Word' },
    docx:{ icon: '📝', label: 'Word' },
    ppt: { icon: '📊', label: 'PPT' },
    pptx:{ icon: '📊', label: 'PPT' },
    xls: { icon: '📈', label: 'Excel' },
    xlsx:{ icon: '📈', label: 'Excel' },
    txt: { icon: '📃', label: 'TXT' }
  };
  var ALLOWED_EXTS = Object.keys(FILE_TYPES);
  var IMAGE_EXTS = ['jpg','jpeg','png','gif','webp','jpg'];
  var HTML_EXTS = ['html','htm'];
  var DOC_EXTS = ['doc','docx','ppt','pptx','xls','xlsx'];

  function getExtFromFile(f){
    if(f.ext) return f.ext.toLowerCase().replace('jpeg','jpg');
    var candidates = [f.key||'', f.url||'', f.title||''];
    for(var i=0;i<candidates.length;i++){
      var s=candidates[i];
      var m=s.match(/\.([a-z0-9]+)(?:\?|#|$)/i);
      if(m){
        var e=m[1].toLowerCase();
        if(e==='jpeg') e='jpg';
        if(e.length<=5) return e;
      }
    }
    return 'pdf';
  }
  function getFileIcon(ext){ return (FILE_TYPES[ext]&&FILE_TYPES[ext].icon)||'📄'; }
  function getFileLabel(ext){ return (FILE_TYPES[ext]&&FILE_TYPES[ext].label)||ext.toUpperCase(); }
  function cleanTitleForDisplay(f){
    var raw = (f.title && f.title.trim().length>1 && f.title.toLowerCase()!=='undefined') ? f.title : (f.key ? f.key.split('/').pop().replace(/^\d+_/,'').replace(/\.[a-z0-9]+$/i,'').replace(/_/g,' ') : 'ملف بدون عنوان');
    return raw.replace(/\.[a-z0-9]+$/i,'').replace(/_/g,' ').trim();
  }
  function downloadFile(f){
    var ext=getExtFromFile(f);
    var name=cleanTitleForDisplay(f)+'.'+ext;
    if(typeof Viewer!=='undefined'&&Viewer.download){
      Viewer.download(f.url,name,f.downloadUrl);
    }else{
      var a=document.createElement('a'); a.href=f.url; a.download=name; a.target='_blank'; document.body.appendChild(a); a.click(); a.remove();
    }
  }

  var local = location.protocol === 'file:' || /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  var st = { admin: false, preview: false, files: null, tabsConfig: null, fileOrders: {} }, seq = 0;
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var SPIN = '<div class="state"><div class="spin"></div></div>';

  function toast(msg){
    var t=document.querySelector('.toast'); if(!t){ t=document.createElement('div'); t.className='toast'; document.body.appendChild(t); }
    t.textContent=msg; t.classList.add('show'); setTimeout(function(){ t.classList.remove('show'); }, 3000);
  }
  function platformConfirm(title, message, danger){
    if(window.PlatformDialog && window.PlatformDialog.confirm){
      return window.PlatformDialog.confirm({title:title, message:message, danger:!!danger, confirmText: danger ? 'حذف' : 'تأكيد', cancelText:'إلغاء'});
    }
    return Promise.resolve(confirm(message));
  }

  async function loadTabsConfig(){
    try{
      var r=await fetch('/api/tabs',{cache:'no-store'});
      if(r.ok){ var j=await r.json(); if(j) return j; }
    }catch(e){}
    return null;
  }
  async function loadOrders(){
    try{
      var r=await fetch('/api/reorder',{cache:'no-store'});
      if(r.ok){ var j=await r.json(); return j||{}; }
    }catch(e){}
    return {};
  }
  async function saveTabsConfig(cfg){
    var r=await fetch('/api/tabs',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify(cfg)});
    return r.ok;
  }
  async function saveOrder(grade,term,subject,kind,orderArr){
    var r=await fetch('/api/reorder',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify({grade:grade,term:term,subject:subject,kind:kind,order:orderArr})});
    return r.ok;
  }

  function getTabsForCurrent(cfg){
    var key = D.grade+'|'+D.subject;
    var key2 = D.subject;
    var tabsList=null;
    if(cfg){
      if(cfg.gradeSubjectTabs && cfg.gradeSubjectTabs[key]) tabsList=cfg.gradeSubjectTabs[key];
      else if(cfg.subjectTabs && cfg.subjectTabs[key2]) tabsList=cfg.subjectTabs[key2];
      else if(cfg.subjectTabs && cfg.subjectTabs[D.grade+'|'+D.term+'|'+D.subject]) tabsList=cfg.subjectTabs[D.grade+'|'+D.term+'|'+D.subject];
    }
    if(!tabsList){
      tabsList = Object.keys(DEFAULT_LABEL).map(function(k){ return {id:k, label:DEFAULT_LABEL[k]}; });
    }
    return tabsList;
  }

  function renderTabsBar(tabsList){
    if(!tabsBar) return;
    tabsBar.innerHTML='';
    tabsList.forEach(function(t){
      var btn=document.createElement('button');
      btn.className='tab'; btn.setAttribute('data-tab', t.id); btn.textContent=t.label;
      tabsBar.appendChild(btn);
    });
    if(st.admin){
      var addBtn=document.createElement('button');
      addBtn.className='tab'; addBtn.style.border='2px dashed #c4cde0'; addBtn.textContent='+ تبويب جديد';
      addBtn.onclick=function(){ openTabModal(null); };
      tabsBar.appendChild(addBtn);
      var manageBtn=document.createElement('button');
      manageBtn.className='btn btn-ghost btn-sm'; manageBtn.style.marginInlineStart='10px'; manageBtn.textContent='⚙ إدارة التبويبات';
      manageBtn.onclick=function(){ openTabsManager(); };
      tabsBar.appendChild(manageBtn);
    }
    Array.prototype.slice.call(document.querySelectorAll('.tab[data-tab]')).forEach(function(t){
      t.addEventListener('click', function(){ show(t.getAttribute('data-tab'), true); });
    });
  }

  var ready = (async function () {
    try {
      var r = await fetch('/api/session', { credentials: 'same-origin', cache: 'no-store' });
      if (!r.ok) throw 0;
      st.admin = !!(await r.json()).admin;
    } catch (e) { if (local) { st.preview = true; st.admin = true; } }
    st.tabsConfig = await loadTabsConfig();
    st.fileOrders = await loadOrders();
    if(st.admin){
      var badge=document.createElement('div'); badge.className='admin-badge';
      badge.innerHTML='<span class="dot"></span> وضع الأدمن - سحب لإعادة الترتيب + تعديل التبويبات';
      document.body.appendChild(badge);
    }
    var tabsList = getTabsForCurrent(st.tabsConfig);
    renderTabsBar(tabsList);
    var h = location.hash.slice(1);
    var ids = tabsList.map(function(t){return t.id;});
    show(ids.indexOf(h)>-1?h:ids[0]||'book');
  })();

  async function exists(url) { try { return (await fetch(url, { method: 'HEAD' })).ok; } catch (e) { return null; } }
  async function showStatic(tab, my) {
    panel.innerHTML = SPIN;
    var fileName = tab === 'book' ? 'book.pdf' : tab === 'workbook' ? 'workbook.pdf' : tab === 'nahw' ? 'nahw.pdf' : tab === 'balagha' ? 'balagha.pdf' : tab === 'exercises' ? 'exercises.pdf' : tab === 'applications' ? 'applications.pdf' : 'qbank.pdf';
    var url = D.pdf + fileName, ok = await exists(url);
    if (my !== seq) return;
    if (ok === false) {
      var label = (getTabsForCurrent(st.tabsConfig).find(function(t){return t.id===tab;})||{}).label || tab;
      panel.innerHTML = '<div class="state"><div class="ico">📂</div><h3>لم يُرفع ' + esc(label) + ' بعد</h3><p>سيظهر هنا فور إضافة الملف.</p></div>';
      return;
    }
    panel.innerHTML = '<div class="v-body"></div>';
    try{
      Viewer.mount(panel.firstChild, { url: url, name: D.title + ' - ' + tab });
      setTimeout(function(){
        var body=panel.firstChild;
        if(body && !body.querySelector('iframe') && !body.querySelector('canvas') && !body.querySelector('embed')){
          body.innerHTML='<iframe src="'+esc(url)+'#toolbar=0&view=FitH" class="pdf-iframe" allow="fullscreen"></iframe>';
        }
      },700);
    }catch(e){
      panel.firstChild.innerHTML='<iframe src="'+esc(url)+'#toolbar=0&view=FitH" class="pdf-iframe" allow="fullscreen"></iframe>';
    }
  }

  function fmtSize(n) { return n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round((n || 0) / 1024)) + ' KB'; }
  function fmtDate(t) { try { return new Date(t).toLocaleDateString('ar-u-nu-latn', { year: 'numeric', month: 'long', day: 'numeric' }); } catch (e) { return ''; } }
  async function loadFiles() {
    if (st.files) return st.files;
    var all = [];
    if (!st.preview) {
      try {
        var r = await fetch('/api/files' + (st.admin ? '?t=' + Date.now() : ''), { credentials: 'same-origin' });
        if (r.ok) all = await r.json();
      } catch (e) { }
    }
    st.files = all.filter(function (f) { return f.grade === D.grade && f.term === D.term && f.subject === D.subject; });
    return st.files;
  }
  function sortByOrder(items, kind){
    var key = D.grade+'|'+D.term+'|'+D.subject+'|'+kind;
    var order = st.fileOrders[key];
    if(!order || !order.length) return items;
    var map={}; items.forEach(function(it){ map[it.key||it.url]=it; });
    var sorted=[];
    order.forEach(function(k){ if(map[k]){ sorted.push(map[k]); delete map[k]; } });
    Object.keys(map).forEach(function(k){ sorted.push(map[k]); });
    return sorted;
  }

  function card(f, i, kind) {
    var ext=getExtFromFile(f);
    var displayTitle=cleanTitleForDisplay(f);
    var icon=getFileIcon(ext);
    var label=getFileLabel(ext);
    var dragHandle = st.admin ? '<span class="drag-handle" draggable="true" title="اسحب لإعادة الترتيب" style="cursor:grab;padding:6px">☰</span>' : '';
    return '<article class="f-card '+(st.admin?'draggable-card':'')+'" data-key="'+esc(f.key||f.url)+'" data-i="'+i+'" data-ext="'+esc(ext)+'" draggable="'+(st.admin?'true':'false')+'">'+dragHandle+'<span class="f-ico" title="'+esc(ext)+'">'+icon+'<small>'+esc(label)+'</small></span><div class="f-info"><h4>' + esc(displayTitle) + '</h4>' +
      '<p class="f-meta"><span>' + esc(fmtDate(f.uploadedAt)) + '</span><span dir="ltr">' + fmtSize(f.size) + ' • '+ext.toUpperCase()+'</span></p></div>' +
      '<div class="f-act"><button type="button" class="btn btn-navy btn-sm" data-act="view" data-i="' + i + '">عرض</button>' +
      '<button type="button" class="btn btn-gold btn-sm" data-act="dl" data-i="' + i + '">تحميل</button>' +
      (st.admin ? '<button type="button" class="btn btn-ghost btn-sm" data-act="edit" data-i="'+i+'">✏</button><button type="button" class="btn btn-danger btn-sm" data-act="del" data-i="' + i + '">حذف</button>' : '') + '</div></article>';
  }

  async function showList(kind, my) {
    panel.innerHTML = SPIN;
    var rawItems = (await loadFiles()).filter(function (f) { return f.kind === kind; });
    var items = sortByOrder(rawItems, kind);
    if (my !== seq) return;
    var h = '';
    if (st.admin) h += '<div style="margin-bottom:12px;display:flex;gap:8px;align-items:center;flex-wrap:wrap"><span style="font-size:13px;color:var(--muted)">☰ اسحب البطاقات لإعادة الترتيب - الترتيب يحفظ تلقائيا</span><button type="button" class="btn btn-ghost btn-sm" id="btnResetOrder">إعادة للافتراضي</button></div>';
    if (st.admin) h += '<button type="button" class="add-card" data-act="add"><span class="plus">+</span>إضافة ' + esc((getTabsForCurrent(st.tabsConfig).find(function(t){return t.id===kind;})||{}).label || kind) + '</button>';
    if (!items.length) h += '<div class="state"><div class="ico">📂</div><h3>لا يوجد ملفات</h3><p>لم يتم رفع ملفات في هذا القسم بعد.</p></div>';
    else items.forEach(function (f, i) { h += card(f, i, kind); });
    panel.innerHTML = '<div class="p-scroll"><div class="files" id="filesList">' + h + '</div></div>';
    var listEl = panel.querySelector('#filesList');
    listEl.onclick = function (e) {
      var b = e.target.closest('[data-act]'); if (!b) return;
      var act = b.getAttribute('data-act'), idx = +b.getAttribute('data-i'), f = items[idx];
      if (act === 'view') view(f, kind);
      else if (act === 'dl') downloadFile(f);
      else if (act === 'del') remove(f, kind);
      else if (act === 'edit') openEditFileModal(f, kind);
      else if (act === 'add') openUpload(kind);
    };
    var resetBtn = document.getElementById('btnResetOrder');
    if(resetBtn) resetBtn.onclick=async function(){
      var ok=await platformConfirm('إعادة الترتيب','هل تريد إعادة ترتيب الملفات للوضع الافتراضي (حسب تاريخ الرفع)؟');
      if(ok){ var k=D.grade+'|'+D.term+'|'+D.subject+'|'+kind; delete st.fileOrders[k]; await saveOrder(D.grade,D.term,D.subject,kind,[]); showList(kind,my); }
    };
    if(st.admin) enableDragDrop(listEl, kind, items);
  }

  function enableDragDrop(container, kind, items){
    var dragSrc=null;
    container.querySelectorAll('.draggable-card').forEach(function(card){
      card.addEventListener('dragstart', function(e){
        dragSrc=card; e.dataTransfer.effectAllowed='move'; e.dataTransfer.setData('text/plain', card.getAttribute('data-key'));
        setTimeout(function(){ card.classList.add('dragging'); },0);
      });
      card.addEventListener('dragend', function(){ card.classList.remove('dragging'); document.querySelectorAll('.drag-over').forEach(function(el){el.classList.remove('drag-over');}); });
      card.addEventListener('dragover', function(e){ e.preventDefault(); e.dataTransfer.dropEffect='move'; card.classList.add('drag-over'); });
      card.addEventListener('dragleave', function(){ card.classList.remove('drag-over'); });
      card.addEventListener('drop', function(e){
        e.preventDefault(); card.classList.remove('drag-over');
        if(dragSrc && dragSrc!==card){
          var cards = Array.prototype.slice.call(container.querySelectorAll('.draggable-card'));
          var srcIdx = cards.indexOf(dragSrc), targetIdx = cards.indexOf(card);
          if(srcIdx<targetIdx) card.parentNode.insertBefore(dragSrc, card.nextSibling);
          else card.parentNode.insertBefore(dragSrc, card);
          var newOrder = Array.prototype.slice.call(container.querySelectorAll('.draggable-card')).map(function(c){return c.getAttribute('data-key');});
          saveOrder(D.grade,D.term,D.subject,kind,newOrder).then(function(){ st.fileOrders[D.grade+'|'+D.term+'|'+D.subject+'|'+kind]=newOrder; toast('تم حفظ الترتيب ✓'); });
        }
      });
    });
  }

  function view(f, kind) {
    var ext=getExtFromFile(f);
    var displayTitle=cleanTitleForDisplay(f);
    panel.innerHTML = '<div class="v-head"><button type="button" class="btn btn-ghost btn-sm" data-back>رجوع للقائمة</button><b>' + esc(displayTitle) + ' <small style="opacity:.6">.'+ext+'</small></b><button type="button" class="btn btn-gold btn-sm" data-dl>تحميل</button></div><div class="v-body"></div>';
    panel.querySelector('[data-back]').onclick = function () { show(kind); };
    panel.querySelector('[data-dl]').onclick = function () { downloadFile(f); };
    var body=panel.querySelector('.v-body');

    if(IMAGE_EXTS.indexOf(ext)>-1){
      body.innerHTML='<div class="img-viewer"><img src="'+esc(f.url)+'" alt="'+esc(displayTitle)+'" loading="lazy"><p class="img-caption">'+esc(displayTitle)+'</p></div>';
    }else if(HTML_EXTS.indexOf(ext)>-1){
      body.innerHTML='<div class="html-viewer"><iframe src="'+esc(f.url)+'" class="html-iframe" sandbox="allow-same-origin allow-scripts allow-popups allow-forms" allow="fullscreen"></iframe></div>';
    }else if(ext==='pdf'){
      try{
        if(typeof Viewer!=='undefined'&&Viewer.mount){
          Viewer.mount(body,{url:f.url,name:f.title});
          setTimeout(function(){
            if(!body.querySelector('iframe')&&!body.querySelector('canvas')&&!body.querySelector('embed')){
              body.innerHTML='<iframe src="'+esc(f.url)+'#toolbar=0&view=FitH" class="pdf-iframe" allow="fullscreen"></iframe>';
            }
          },800);
        }else{
          body.innerHTML='<iframe src="'+esc(f.url)+'#toolbar=0&view=FitH" class="pdf-iframe" allow="fullscreen"></iframe>';
        }
      }catch(e){
        body.innerHTML='<iframe src="'+esc(f.url)+'#toolbar=0&view=FitH" class="pdf-iframe" allow="fullscreen"></iframe>';
      }
    }else if(DOC_EXTS.indexOf(ext)>-1){
      var gviewUrl='https://docs.google.com/gview?url='+encodeURIComponent(f.url)+'&embedded=true';
      var officeUrl='https://view.officeapps.live.com/op/embed.aspx?src='+encodeURIComponent(f.url);
      body.innerHTML='<div class="doc-viewer"><div class="doc-tabs"><button class="btn btn-navy btn-sm is-active" data-viewer="gview">عرض Google</button><button class="btn btn-ghost btn-sm" data-viewer="office">عرض Office</button><a class="btn btn-gold btn-sm" href="'+esc(f.url)+'" target="_blank">فتح مباشر</a></div><iframe id="docFrame" src="'+gviewUrl+'" class="doc-iframe" allow="fullscreen"></iframe><p class="doc-hint">لو لم يظهر الملف، اضغط "فتح مباشر" أو "تحميل"</p></div>';
      var gBtn=body.querySelector('[data-viewer="gview"]');
      var oBtn=body.querySelector('[data-viewer="office"]');
      var frame=body.querySelector('#docFrame');
      if(gBtn&&oBtn&&frame){
        gBtn.onclick=function(){ frame.src=gviewUrl; gBtn.classList.add('is-active'); oBtn.classList.remove('is-active'); };
        oBtn.onclick=function(){ frame.src=officeUrl; oBtn.classList.add('is-active'); gBtn.classList.remove('is-active'); };
      }
    }else if(ext==='txt'){
      fetch(f.url).then(function(r){return r.text();}).then(function(t){
        body.innerHTML='<pre class="txt-viewer">'+esc(t)+'</pre>';
      }).catch(function(){
        body.innerHTML='<div class="state"><p>تعذر عرض الملف. <a href="'+esc(f.url)+'" target="_blank">افتحه في تبويب جديد</a></p></div>';
      });
    }else{
      body.innerHTML='<div class="state"><div class="ico">📄</div><h3>معاينة مباشرة</h3><p>اضغط لفتح الملف مباشرة في المتصفح</p><a class="btn btn-navy" href="'+esc(f.url)+'" target="_blank">فتح الملف</a></div>';
    }
  }

  async function remove(f, kind) {
    var ok = await platformConfirm('حذف الملف', 'هل تريد حذف الملف «' + esc(cleanTitleForDisplay(f)) + '» نهائياً؟ لا يمكن التراجع.', true);
    if (!ok) return;
    try {
      if (!st.preview) {
        var r = await fetch('/api/delete', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: f.url, key:f.key }) });
        if (!r.ok) throw 0;
      }
      st.files = st.files.filter(function (x) { return x.url !== f.url; });
      toast('تم حذف الملف'); show(kind);
    } catch (e) { toast('تعذّر الحذف، حاول مرة أخرى'); }
  }

  var modal, file, curKind;
  async function send(kind, title, f, onp) {
    var item = { grade: D.grade, term: D.term, subject: D.subject, kind: kind, title: title, size: f.size, uploadedAt: new Date().toISOString() };
    if (st.preview) {
      for (var i = 1; i <= 10; i++) { await new Promise(function (r) { setTimeout(r, 70); }); onp(i * 10); }
      item.url = URL.createObjectURL(f); 
      item.ext=(f.name.split('.').pop()||'pdf').toLowerCase();
      return item;
    }
    var formData = new FormData();
    formData.append('grade', D.grade);
    formData.append('term', D.term);
    formData.append('subject', D.subject);
    formData.append('kind', kind);
    formData.append('title', title);
    formData.append('file', f);
    var xhr = new XMLHttpRequest();
    var uploadPromise = new Promise(function(resolve, reject){
      xhr.upload.onprogress = function(e){ if(e.lengthComputable){ onp(Math.round((e.loaded / e.total) * 100)); } };
      xhr.onload = function(){
        if(xhr.status >= 200 && xhr.status < 300){
          try { resolve(JSON.parse(xhr.responseText)); } catch (e) { reject(new Error('Invalid response')); }
        } else { var msg=xhr.responseText; try{msg=JSON.parse(msg).error||msg;}catch(e){} reject(new Error('Upload failed: '+xhr.status+' '+msg)); }
      };
      xhr.onerror = function(){ reject(new Error('Network error')); };
    });
    xhr.open('POST', '/api/upload-r2'); xhr.withCredentials = true; xhr.send(formData);
    var resp = await uploadPromise;
    item.url = resp.url; item.key = resp.key; item.ext=resp.ext; item.mimeType=resp.mimeType; item.publicUrl = resp.publicUrl || resp.url;
    return item;
  }

  function buildModal() {
    modal = document.createElement('div'); modal.className = 'modal';
    var acceptStr=".pdf,.html,.htm,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt";
    modal.innerHTML = '<div class="m-box" role="dialog" aria-modal="true" aria-labelledby="upT"><button type="button" class="m-x" aria-label="إغلاق">✕</button>' +
      '<h3 id="upT">إضافة ملف جديد</h3>' +
      '<label class="field">اسم الملف<input type="text" id="upName" maxlength="80" placeholder="مثال: ورقة عمل الوحدة الأولى - HTML تفاعلي"></label>' +
      '<div class="drop" id="upDrop" tabindex="0" role="button">اضغط لاختيار ملف أو اسحبه إلى هنا<br><small>PDF, صور, Word, Excel, PowerPoint, HTML, TXT (حتى 50MB)</small><input type="file" id="upFile" accept="'+acceptStr+'" hidden></div>' +
      '<div class="bar" id="upBar"><i></i></div><p class="err" id="upErr" role="alert"></p>' +
      '<div class="m-act"><button type="button" class="btn btn-navy" id="upGo">رفع الملف</button><button type="button" class="btn btn-ghost" data-x>إلغاء</button></div></div>';
    document.body.appendChild(modal);
    var $ = function (id) { return modal.querySelector('#' + id); };
    var drop = $('upDrop'), input = $('upFile'), name = $('upName'), bar = $('upBar'), go = $('upGo');
    var err = function (m) { $('upErr').textContent = m || ''; };
    function pick(f) { 
      file = f || null; err(''); drop.classList.toggle('has', !!file); 
      if(file){
        var ext=(file.name.split('.').pop()||'').toLowerCase();
        var icon=FILE_TYPES[ext]?FILE_TYPES[ext].icon:'📄';
        drop.innerHTML=icon+' '+file.name+' ('+fmtSize(file.size)+')<br><small>.'+ext.toUpperCase()+'</small><input type="file" id="upFile" accept="'+acceptStr+'" hidden>';
        var newInp=drop.querySelector('#upFile');
        if(newInp) newInp.onchange=function(){ pick(newInp.files[0]); };
      }else{
        drop.innerHTML='اضغط لاختيار ملف أو اسحبه إلى هنا<br><small>PDF, صور, Word, Excel, PowerPoint, HTML, TXT (حتى 50MB)</small><input type="file" id="upFile" accept="'+acceptStr+'" hidden>';
        var newInp2=drop.querySelector('#upFile');
        if(newInp2) newInp2.onchange=function(){ pick(newInp2.files[0]); };
      }
      if (file && !name.value.trim()) name.value = file.name.replace(/\.[a-z0-9]+$/i, '').replace(/[_-]+/g,' ').trim(); 
    }
    name.oninput = function () { err(''); };
    drop.onclick = function (e) { if(e.target.closest('#upFile')) return; var inp=modal.querySelector('#upFile'); if(inp) inp.click(); };
    drop.onkeydown = function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); var inp=modal.querySelector('#upFile'); if(inp) inp.click(); } };
    input.onchange = function () { pick(input.files[0]); };
    drop.ondragover = function (e) { e.preventDefault(); drop.classList.add('drag-over'); };
    drop.ondragleave = function(){ drop.classList.remove('drag-over'); };
    drop.ondrop = function (e) { e.preventDefault(); drop.classList.remove('drag-over'); pick(e.dataTransfer.files[0]); };
    modal.onclick = function (e) { if (e.target === modal || e.target.closest('.m-x') || e.target.closest('[data-x]')) modal.classList.remove('open'); };
    go.onclick = async function () {
      var title = name.value.trim();
      if (title.length < 2) return err('اكتب اسم الملف (حرفان على الأقل).');
      if (!file) return err('اختر ملف أولاً.');
      var ext=(file.name.split('.').pop()||'').toLowerCase(); if(ext==='jpeg') ext='jpg';
      if(ALLOWED_EXTS.indexOf(ext)===-1){ return err('نوع الملف .'+ext+' غير مدعوم. المدعوم: '+ALLOWED_EXTS.join(', ')); }
      if (file.size > 50 * 1048576) return err('حجم الملف أكبر من 50 ميغابايت.');
      err(''); go.disabled = true; bar.style.display = 'block'; bar.firstChild.style.width = '0%';
      try {
        var item = await send(curKind, title, file, function (p) { bar.firstChild.style.width = p + '%'; });
        st.files = null; await loadFiles();
        var exists = st.files.some(function(x){ return x.key === item.key || x.url === item.url; });
        if (!exists) st.files.push(item);
        modal.classList.remove('open'); toast('تم رفع الملف بنجاح'); show(curKind);
      } catch (e) { console.error(e); err(e.message || 'تعذّر الرفع.'); }
      go.disabled = false;
    };
    modal.reset = function () { pick(null); name.value = ''; err(''); bar.style.display = 'none'; var inp=modal.querySelector('#upFile'); if(inp) inp.value=''; };
  }
  function openUpload(kind) { if (!modal) buildModal(); curKind = kind; modal.reset(); modal.classList.add('open'); modal.querySelector('#upName').focus(); }

  function openEditFileModal(f, kind){
    var m=document.createElement('div'); m.className='modal open';
    m.innerHTML='<div class="m-box"><button class="m-x">✕</button><h3>تعديل اسم الملف</h3><label class="field">الاسم<input id="editName" value="'+esc(f.title)+'"></label><p class="err" id="editErr"></p><div class="m-act"><button class="btn btn-navy" id="editSave">حفظ</button><button class="btn btn-ghost" id="editCancel">إلغاء</button></div></div>';
    document.body.appendChild(m);
    function close(){ m.classList.remove('open'); setTimeout(function(){m.remove();},200); }
    m.querySelector('.m-x').onclick=close; m.querySelector('#editCancel').onclick=close; m.onclick=function(e){ if(e.target===m) close(); };
    m.querySelector('#editSave').onclick=async function(){
      var newTitle=m.querySelector('#editName').value.trim();
      if(newTitle.length<2){ m.querySelector('#editErr').textContent='اكتب اسم صحيح'; return; }
      try{
        var r=await fetch('/api/update-file',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify({url:f.url, title:newTitle})});
        if(!r.ok){ f.title=newTitle; }else{ var j=await r.json(); f.title=j.title||newTitle; }
        close(); toast('تم تعديل الاسم'); show(kind);
      }catch(e){ m.querySelector('#editErr').textContent='فشل التعديل'; }
    };
  }

  var tabModal=null;
  function ensureTabModal(){
    if(tabModal) return tabModal;
    tabModal=document.createElement('div'); tabModal.className='modal';
    tabModal.innerHTML='<div class="m-box"><button class="m-x">✕</button><h3 id="tabMTitle">تبويب</h3><div id="tabMBody" style="margin-top:14px"></div><p class="err" id="tabMErr"></p><div class="m-act"><button class="btn btn-navy" id="tabMSave">حفظ</button><button class="btn btn-ghost" id="tabMCancel">إلغاء</button></div></div>';
    document.body.appendChild(tabModal);
    tabModal.querySelector('.m-x').onclick=function(){tabModal.classList.remove('open');};
    tabModal.querySelector('#tabMCancel').onclick=function(){tabModal.classList.remove('open');};
    tabModal.onclick=function(e){ if(e.target===tabModal) tabModal.classList.remove('open'); };
    return tabModal;
  }
  function openTabModal(existingId){
    var m=ensureTabModal();
    var isNew=!existingId;
    var tabsList=getTabsForCurrent(st.tabsConfig);
    var existing = tabsList.find(function(t){return t.id===existingId;}) || {id:'', label:''};
    m.querySelector('#tabMTitle').textContent=isNew?'إضافة تبويب جديد':'تعديل تبويب';
    m.querySelector('#tabMBody').innerHTML='<label class="field">معرف التبويب (بالإنجليزية، مثال: worksheets)<input id="tabId" value="'+esc(existing.id)+'" '+(isNew?'':'readonly')+' placeholder="worksheets"></label><label class="field">اسم التبويب الظاهر<input id="tabLabel" value="'+esc(existing.label)+'" placeholder="أوراق عمل"></label>';
    m.classList.add('open');
    m.querySelector('#tabMSave').onclick=async function(){
      var id=m.querySelector('#tabId').value.trim().toLowerCase().replace(/\s+/g,'_');
      var label=m.querySelector('#tabLabel').value.trim();
      if(!id||!label){ m.querySelector('#tabMErr').textContent='اكمل البيانات'; return; }
      if(!/^[a-z0-9_-]+$/.test(id)){ m.querySelector('#tabMErr').textContent='المعرف يجب أن يكون إنجليزي بدون مسافات'; return; }
      var cfg = st.tabsConfig || {subjectTabs:{}, gradeSubjectTabs:{}};
      cfg.subjectTabs = cfg.subjectTabs||{}; cfg.gradeSubjectTabs=cfg.gradeSubjectTabs||{};
      var key = D.subject;
      var list = cfg.subjectTabs[key] || getTabsForCurrent(null);
      if(isNew){
        if(list.some(function(t){return t.id===id;})){ m.querySelector('#tabMErr').textContent='المعرف موجود مسبقا'; return; }
        list.push({id:id, label:label});
      }else{
        var idx=list.findIndex(function(t){return t.id===id;});
        if(idx>-1) list[idx].label=label;
      }
      cfg.subjectTabs[key]=list;
      var ok=await saveTabsConfig(cfg);
      if(ok){ st.tabsConfig=cfg; m.classList.remove('open'); renderTabsBar(list); toast('تم حفظ التبويب'); show(list[0].id); }
      else m.querySelector('#tabMErr').textContent='فشل الحفظ';
    };
  }
  function openTabsManager(){
    var m=ensureTabModal();
    var list=getTabsForCurrent(st.tabsConfig);
    var html='<p style="color:var(--muted);font-size:13px;margin-bottom:10px">اسحب لإعادة ترتيب التبويبات - التبويبات الأساسية (كتاب الطالب) لا يمكن حذفها</p>';
    html+='<div id="tabsManagerList">';
    list.forEach(function(t){
      html+='<div class="f-card" data-tab-id="'+esc(t.id)+'" draggable="true" style="cursor:grab"><span>☰</span><b style="margin-inline-start:8px">'+esc(t.label)+'</b><small style="margin-inline-start:auto;color:var(--muted)">'+esc(t.id)+'</small><button class="btn btn-ghost btn-sm" data-edit-tab="'+esc(t.id)+'">✏</button><button class="btn btn-danger btn-sm" data-del-tab="'+esc(t.id)+'">🗑</button></div>';
    });
    html+='</div>';
    m.querySelector('#tabMTitle').textContent='إدارة التبويبات - '+D.title;
    m.querySelector('#tabMBody').innerHTML=html;
    m.querySelector('#tabMSave').style.display='none';
    m.querySelector('#tabMCancel').textContent='إغلاق';
    m.classList.add('open');
    var container=m.querySelector('#tabsManagerList');
    var dragSrc=null;
    container.querySelectorAll('[data-tab-id]').forEach(function(card){
      card.addEventListener('dragstart', function(e){ dragSrc=card; e.dataTransfer.effectAllowed='move'; setTimeout(function(){card.classList.add('dragging');},0); });
      card.addEventListener('dragend', function(){ card.classList.remove('dragging'); });
      card.addEventListener('dragover', function(e){ e.preventDefault(); card.classList.add('drag-over'); });
      card.addEventListener('dragleave', function(){ card.classList.remove('drag-over'); });
      card.addEventListener('drop', function(e){ e.preventDefault(); card.classList.remove('drag-over'); if(dragSrc&&dragSrc!==card){ var cards=Array.prototype.slice.call(container.querySelectorAll('[data-tab-id]')); var s=cards.indexOf(dragSrc), t=cards.indexOf(card); if(s<t) card.parentNode.insertBefore(dragSrc, card.nextSibling); else card.parentNode.insertBefore(dragSrc, card); saveTabsOrder(); } });
    });
    container.querySelectorAll('[data-edit-tab]').forEach(function(b){ b.onclick=function(){ var id=b.getAttribute('data-edit-tab'); m.classList.remove('open'); openTabModal(id); }; });
    container.querySelectorAll('[data-del-tab]').forEach(function(b){
      b.onclick=async function(){
        var id=b.getAttribute('data-del-tab');
        if(['book','qbank'].includes(id)){ toast('لا يمكن حذف هذا التبويب'); return; }
        var ok=await platformConfirm('حذف التبويب','هل تريد حذف تبويب "'+id+'"؟ سيتم حذف كل ملفاته من العرض فقط (الملفات تبقى في R2).',true);
        if(!ok) return;
        var cfg=st.tabsConfig; var key=D.subject; var list=cfg.subjectTabs[key]||[]; cfg.subjectTabs[key]=list.filter(function(t){return t.id!==id;});
        var saved=await saveTabsConfig(cfg);
        if(saved){ st.tabsConfig=cfg; b.closest('[data-tab-id]').remove(); renderTabsBar(cfg.subjectTabs[key]); toast('تم حذف التبويب'); }
      };
    });
    async function saveTabsOrder(){
      var newOrder=Array.prototype.slice.call(container.querySelectorAll('[data-tab-id]')).map(function(c){ return {id:c.getAttribute('data-tab-id'), label:c.querySelector('b').textContent}; });
      var cfg=st.tabsConfig; cfg.subjectTabs[D.subject]=newOrder;
      await saveTabsConfig(cfg); st.tabsConfig=cfg; renderTabsBar(newOrder); toast('تم حفظ ترتيب التبويبات');
    }
  }

  function show(tab, push) {
    var my = ++seq;
    var tabsList = getTabsForCurrent(st.tabsConfig);
    var allTabs = document.querySelectorAll('.tab[data-tab]');
    allTabs.forEach(function (t) { var on = t.getAttribute('data-tab') === tab; t.classList.toggle('is-active', on); t.setAttribute('aria-selected', on ? 'true' : 'false'); });
    if (push) history.replaceState(null, '', '#' + tab);
    var isStatic = ['book','workbook','nahw','balagha','exercises','applications','qbank'].indexOf(tab) > -1;
    if (isStatic) showStatic(tab, my); else showList(tab, my);
  }
})();