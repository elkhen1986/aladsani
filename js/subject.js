/* صفحة المادة - أدمن: تحكم كامل / معلم: يضيف ويمسح ملفات بس - ممنوع تعديل اسم/غلاف/تبويبات/ترتيب */
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

  var local = location.protocol === 'file:' || /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  var st = { admin: false, teacher:false, teacherSubjects:[], teacherName:'', preview: false, files: null, tabsConfig: null, fileOrders: {} }, seq = 0;
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

  function canManageFiles(){
    if(st.admin) return true;
    if(st.teacher){
      var subj=D.subject;
      var list=st.teacherSubjects||[];
      if(!list.length) return false;
      if(list.includes('*') || list.includes('all')) return true;
      if(list.includes(subj)) return true;
    }
    return false;
  }
  function canEditTabs(){ return st.admin; }
  function canReorder(){ return st.admin; }
  function canEditFileTitle(){ return st.admin; }

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
      if(canEditTabs()){
        var editSpan=document.createElement('span');
        editSpan.innerHTML=' <small style="opacity:.6">✏</small>';
        editSpan.style.cursor='pointer';
        editSpan.onclick=function(e){ e.stopPropagation(); openTabModal(t.id); };
      }
      tabsBar.appendChild(btn);
    });
    if(canEditTabs()){
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
      var j=await r.json();
      st.admin = !!j.admin;
      st.teacher = !!j.teacher;
      st.teacherSubjects = j.subjects||[];
      st.teacherName = j.name||j.username||'';
    } catch (e) { if (local) { st.preview = true; st.admin = true; } }
    st.tabsConfig = await loadTabsConfig();
    st.fileOrders = await loadOrders();
    if(st.admin){
      var badge=document.createElement('div'); badge.className='admin-badge';
      badge.innerHTML='<span class="dot"></span> وضع الأدمن - سحب لإعادة الترتيب + تعديل التبويبات';
      document.body.appendChild(badge);
    } else if(st.teacher && canManageFiles()){
      var badge=document.createElement('div'); badge.className='admin-badge'; badge.style.background='#0f766e';
      badge.innerHTML='<span class="dot" style="background:#fde68a"></span> معلم: '+esc(st.teacherName)+' - إضافة وحذف ملفات فقط';
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
      panel.innerHTML = '<div class="state"><div class="ico">📂</div><h3>لم يُرفع ' + esc(label) + ' بعد</h3><p>سيظهر هنا فور إضافة الملف.</p>'+(canManageFiles()?'<button class="btn btn-navy btn-sm" style="margin-top:12px" onclick="document.querySelector(\'[data-act=add]\')?.click()">رفع كتاب</button>':'')+'</div>';
      return;
    }
    panel.innerHTML = '<div class="v-body"></div>';
    Viewer.mount(panel.firstChild, { url: url, name: D.title + ' - ' + tab });
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
    var displayTitle = (f.title && f.title.trim().length > 1 && f.title.toLowerCase() !== 'undefined') ? f.title : (f.key ? f.key.split('/').pop().replace(/^\d+_/, '').replace(/\.pdf$/i,'').replace(/_/g,' ') : 'ملف بدون عنوان');
    var dragHandle = canReorder() ? '<span class="drag-handle" draggable="true" title="اسحب لإعادة الترتيب" style="cursor:grab;padding:6px">☰</span>' : '';
    var editBtn = canEditFileTitle() ? '<button type="button" class="btn btn-ghost btn-sm" data-act="edit" data-i="'+i+'">✏</button>' : '';
    var delBtn = canManageFiles() ? '<button type="button" class="btn btn-danger btn-sm" data-act="del" data-i="' + i + '">حذف</button>' : '';
    return '<article class="f-card '+(canReorder()?'draggable-card':'')+'" data-key="'+esc(f.key||f.url)+'" data-i="'+i+'" draggable="'+(canReorder()?'true':'false')+'">'+dragHandle+'<span class="f-ico">PDF</span><div class="f-info"><h4>' + esc(displayTitle) + '</h4>' +
      '<p class="f-meta"><span>' + esc(fmtDate(f.uploadedAt)) + '</span><span dir="ltr">' + fmtSize(f.size) + '</span></p></div>' +
      '<div class="f-act"><button type="button" class="btn btn-navy btn-sm" data-act="view" data-i="' + i + '">عرض</button>' +
      '<button type="button" class="btn btn-gold btn-sm" data-act="dl" data-i="' + i + '">تحميل</button>' +
      editBtn+delBtn + '</div></article>';
  }

  async function showList(kind, my) {
    panel.innerHTML = SPIN;
    var rawItems = (await loadFiles()).filter(function (f) { return f.kind === kind; });
    var items = sortByOrder(rawItems, kind);
    if (my !== seq) return;
    var h = '';
    if (canReorder()) h += '<div style="margin-bottom:12px;display:flex;gap:8px;align-items:center"><span style="font-size:13px;color:var(--muted)">☰ اسحب البطاقات لإعادة الترتيب - الترتيب يحفظ تلقائيا</span><button type="button" class="btn btn-ghost btn-sm" id="btnResetOrder">إعادة للافتراضي</button></div>';
    if (canManageFiles()) h += '<button type="button" class="add-card" data-act="add"><span class="plus">+</span>إضافة ' + esc((getTabsForCurrent(st.tabsConfig).find(function(t){return t.id===kind;})||{}).label || kind) + '</button>';
    if (!items.length) h += '<div class="state"><div class="ico">📂</div><h3>لا يوجد ملفات</h3><p>لم يتم رفع ملفات في هذا القسم بعد.</p></div>';
    else items.forEach(function (f, i) { h += card(f, i, kind); });
    panel.innerHTML = '<div class="p-scroll"><div class="files" id="filesList">' + h + '</div></div>';
    var listEl = panel.querySelector('#filesList');
    listEl.onclick = function (e) {
      var b = e.target.closest('[data-act]'); if (!b) return;
      var act = b.getAttribute('data-act'), idx = +b.getAttribute('data-i'), f = items[idx];
      if (act === 'view') view(f, kind);
      else if (act === 'dl') Viewer.download(f.url, f.title + '.pdf', f.downloadUrl);
      else if (act === 'del') remove(f, kind);
      else if (act === 'edit') openEditFileModal(f, kind);
      else if (act === 'add') openUpload(kind);
    };
    var resetBtn = document.getElementById('btnResetOrder');
    if(resetBtn) resetBtn.onclick=async function(){
      var ok=await platformConfirm('إعادة الترتيب','هل تريد إعادة ترتيب الملفات للوضع الافتراضي (حسب تاريخ الرفع)؟');
      if(ok){ var k=D.grade+'|'+D.term+'|'+D.subject+'|'+kind; delete st.fileOrders[k]; await saveOrder(D.grade,D.term,D.subject,kind,[]); showList(kind,my); }
    };
    if(canReorder()) enableDragDrop(listEl, kind, items);
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
    panel.innerHTML = '<div class="v-head"><button type="button" class="btn btn-ghost btn-sm" data-back>رجوع للقائمة</button><b>' + esc(f.title) +
      '</b><button type="button" class="btn btn-gold btn-sm" data-dl>تحميل</button></div><div class="v-body"></div>';
    panel.querySelector('[data-back]').onclick = function () { show(kind); };
    panel.querySelector('[data-dl]').onclick = function () { Viewer.download(f.url, f.title + '.pdf', f.downloadUrl); };
    Viewer.mount(panel.querySelector('.v-body'), { url: f.url, name: f.title });
  }
  async function remove(f, kind) {
    if(!canManageFiles()){ toast('ليس لديك صلاحية الحذف'); return; }
    var ok = await platformConfirm('حذف الملف', 'هل تريد حذف الملف «' + esc(f.title) + '» نهائياً؟ لا يمكن التراجع.', true);
    if (!ok) return;
    try {
      if (!st.preview) {
        var r = await fetch('/api/delete', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: f.url }) });
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
      item.url = URL.createObjectURL(f); return item;
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
    item.url = resp.url; item.key = resp.key; item.publicUrl = resp.publicUrl || resp.url;
    return item;
  }

  function buildModal() {
    modal = document.createElement('div'); modal.className = 'modal';
    modal.innerHTML = '<div class="m-box" role="dialog" aria-modal="true" aria-labelledby="upT"><button type="button" class="m-x" aria-label="إغلاق">✕</button>' +
      '<h3 id="upT">إضافة ملف جديد</h3>' +
      '<label class="field">اسم الملف<input type="text" id="upName" maxlength="80" placeholder="مثال: ورقة عمل الوحدة الأولى"></label>' +
      '<div class="drop" id="upDrop" tabindex="0" role="button">اضغط لاختيار ملف PDF أو اسحبه إلى هنا<input type="file" id="upFile" accept="application/pdf,.pdf" hidden></div>' +
      '<div class="bar" id="upBar"><i></i></div><p class="err" id="upErr" role="alert"></p>' +
      '<div class="m-act"><button type="button" class="btn btn-navy" id="upGo">رفع الملف</button><button type="button" class="btn btn-ghost" data-x>إلغاء</button></div></div>';
    document.body.appendChild(modal);
    var $ = function (id) { return modal.querySelector('#' + id); };
    var drop = $('upDrop'), input = $('upFile'), name = $('upName'), bar = $('upBar'), go = $('upGo');
    var err = function (m) { $('upErr').textContent = m || ''; };
    function pick(f) { file = f || null; err(''); drop.classList.toggle('has', !!file); drop.firstChild.textContent = file ? file.name + ' (' + fmtSize(file.size) + ')' : 'اضغط لاختيار ملف PDF أو اسحبه إلى هنا'; if (file && !name.value.trim()) name.value = file.name.replace(/\.pdf$/i, ''); }
    name.oninput = function () { err(''); };
    drop.onclick = function () { input.click(); };
    drop.onkeydown = function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); } };
    input.onchange = function () { pick(input.files[0]); };
    drop.ondragover = function (e) { e.preventDefault(); };
    drop.ondrop = function (e) { e.preventDefault(); pick(e.dataTransfer.files[0]); };
    modal.onclick = function (e) { if (e.target === modal || e.target.closest('.m-x') || e.target.closest('[data-x]')) modal.classList.remove('open'); };
    go.onclick = async function () {
      if(!canManageFiles()){ err('ليس لديك صلاحية الرفع'); return; }
      var title = name.value.trim();
      if (title.length < 2) return err('اكتب اسم الملف (حرفان على الأقل).');
      if (!file) return err('اختر ملف PDF أولاً.');
      if (file.type !== 'application/pdf' && !/\.pdf$/i.test(file.name)) return err('الملف يجب أن يكون بصيغة PDF.');
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
    modal.reset = function () { pick(null); name.value = ''; err(''); bar.style.display = 'none'; input.value = ''; };
  }
  function openUpload(kind) { 
    if(!canManageFiles()){ toast('ليس لديك صلاحية الإضافة - المعلم يضيف في مادته فقط'); return; }
    if (!modal) buildModal(); curKind = kind; modal.reset(); modal.classList.add('open'); modal.querySelector('#upName').focus(); 
  }

  function openEditFileModal(f, kind){
    if(!canEditFileTitle()){ toast('تعديل اسم الملف للأدمن فقط'); return; }
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
    if(!canEditTabs()){ toast('إدارة التبويبات للأدمن فقط'); return; }
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
    if(!canEditTabs()){ toast('إدارة التبويبات للأدمن فقط'); return; }
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
        var ok=await platformConfirm('حذف التبويب','هل تريد حذف تبويب "'+id+'"؟',true);
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