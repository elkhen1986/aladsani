/* إدارة التبويبات العامة */
(function(){
  var esc=function(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});};
  function toast(m){ var t=document.querySelector('.toast'); if(!t){ t=document.createElement('div'); t.className='toast'; document.body.appendChild(t);} t.textContent=m; t.classList.add('show'); setTimeout(function(){t.classList.remove('show');},3000); }
  function platformConfirm(title,msg,danger){ if(window.PlatformDialog&&window.PlatformDialog.confirm) return window.PlatformDialog.confirm({title:title,message:msg,danger:!!danger}); return Promise.resolve(confirm(msg)); }

  var cfg=null;
  var subjectsList={};
  var SUBJ_DEFAULT={
    'quran':'القرآن الكريم','islamic':'التربية الإسلامية','arabic':'اللغة العربية','english':'اللغة الإنجليزية',
    'math':'الرياضيات','chemistry':'الكيمياء','physics':'الفيزياء','biology':'الأحياء','it':'تقنية المعلومات'
  };

  async function loadCfg(){ var r=await fetch('/api/tabs',{cache:'no-store'}); if(r.ok){ var j=await r.json(); if(j) return j; } return {subjectTabs:{}, gradeSubjectTabs:{}}; }
  async function loadSubjects(){ try{ var r=await fetch('/api/subjects',{cache:'no-store'}); if(r.ok){ var j=await r.json(); return j.subjects||{}; } }catch(e){} return {}; }
  async function saveCfg(c){ var r=await fetch('/api/tabs',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify(c)}); return r.ok; }

  function renderSelect(){
    var sel=document.getElementById('subjSelect'); sel.innerHTML='';
    Object.keys(subjectsList).forEach(function(id){ var o=document.createElement('option'); o.value=id; o.textContent=(subjectsList[id].name||id)+' ('+id+')'; sel.appendChild(o); });
    Object.keys(SUBJ_DEFAULT).forEach(function(id){ if(!subjectsList[id]){ var o=document.createElement('option'); o.value=id; o.textContent=SUBJ_DEFAULT[id]+' ('+id+') - افتراضي'; sel.appendChild(o); } });
  }

  function getTabsFor(subId){
    if(cfg.subjectTabs && cfg.subjectTabs[subId]) return cfg.subjectTabs[subId];
    // افتراضي
    return [
      {id:'book', label:'كتاب الطالب'},
      {id:'qbank', label:'بنك الأسئلة'},
      {id:'worksheets', label:'أوراق عمل'},
      {id:'quizzes', label:'اختبارات قصيرة'},
      {id:'exams', label:'اختبارات نهاية الفترة'}
    ];
  }

  function renderList(){
    var subId=document.getElementById('subjSelect').value;
    if(!subId) return;
    var list=getTabsFor(subId);
    var container=document.getElementById('tabsList'); container.innerHTML='';
    list.forEach(function(t){
      var div=document.createElement('div'); div.className='f-card'; div.setAttribute('data-tab-id',t.id); div.draggable=true;
      div.innerHTML='<div style="display:flex;align-items:center;gap:8px"><span style="cursor:grab">☰</span><b>'+esc(t.label)+'</b><small style="color:var(--muted);margin-inline-start:auto">'+esc(t.id)+'</small><button class="btn btn-ghost btn-sm" data-edit="'+esc(t.id)+'">✏️</button><button class="btn btn-danger btn-sm" data-del="'+esc(t.id)+'">🗑️</button></div>';
      container.appendChild(div);
    });
    bindDrag();
    bindBtns();
  }

  function bindDrag(){
    var container=document.getElementById('tabsList');
    var dragSrc=null;
    container.querySelectorAll('[data-tab-id]').forEach(function(card){
      card.addEventListener('dragstart', function(e){ dragSrc=card; e.dataTransfer.effectAllowed='move'; setTimeout(function(){card.classList.add('dragging');},0); });
      card.addEventListener('dragend', function(){ card.classList.remove('dragging'); });
      card.addEventListener('dragover', function(e){ e.preventDefault(); card.classList.add('drag-over'); });
      card.addEventListener('dragleave', function(){ card.classList.remove('drag-over'); });
      card.addEventListener('drop', function(e){ e.preventDefault(); card.classList.remove('drag-over'); if(dragSrc&&dragSrc!==card){ var cards=Array.prototype.slice.call(container.querySelectorAll('[data-tab-id]')); var s=cards.indexOf(dragSrc), t=cards.indexOf(card); if(s<t) card.parentNode.insertBefore(dragSrc, card.nextSibling); else card.parentNode.insertBefore(dragSrc, card); saveOrder(); } });
    });
  }
  function bindBtns(){
    document.querySelectorAll('[data-edit]').forEach(function(b){ b.onclick=function(){ openModal(b.getAttribute('data-edit')); }; });
    document.querySelectorAll('[data-del]').forEach(function(b){
      b.onclick=async function(){
        var id=b.getAttribute('data-del');
        if(['book'].includes(id)){ toast('لا يمكن حذف كتاب الطالب'); return; }
        var ok=await platformConfirm('حذف التبويب','حذف تبويب "'+id+'"؟',true);
        if(!ok) return;
        var subId=document.getElementById('subjSelect').value;
        var list=getTabsFor(subId); cfg.subjectTabs[subId]=list.filter(function(t){return t.id!==id;});
        await saveCfg(cfg); toast('تم الحذف'); renderList();
      };
    });
  }
  async function saveOrder(){
    var subId=document.getElementById('subjSelect').value;
    var newOrder=Array.prototype.slice.call(document.querySelectorAll('[data-tab-id]')).map(function(c){ var id=c.getAttribute('data-tab-id'); var label=c.querySelector('b').textContent; return {id:id, label:label}; });
    cfg.subjectTabs[subId]=newOrder;
    await saveCfg(cfg); toast('تم حفظ ترتيب التبويبات');
  }

  var modal=null;
  function ensureModal(){
    if(modal) return modal;
    modal=document.createElement('div'); modal.className='modal';
    modal.innerHTML='<div class="m-box" style="max-width:420px"><button class="m-x">✕</button><h3 id="mTitle"></h3><div id="mBody" style="margin-top:12px"></div><p class="err" id="mErr"></p><div class="m-act"><button class="btn btn-navy" id="mSave">حفظ</button><button class="btn btn-ghost" id="mCancel">إلغاء</button></div></div>';
    document.body.appendChild(modal);
    modal.querySelector('.m-x').onclick=function(){modal.classList.remove('open');};
    modal.querySelector('#mCancel').onclick=function(){modal.classList.remove('open');};
    modal.onclick=function(e){ if(e.target===modal) modal.classList.remove('open'); };
    return modal;
  }
  function openModal(existingId){
    var m=ensureModal();
    var subId=document.getElementById('subjSelect').value;
    var list=getTabsFor(subId);
    var isNew=!existingId;
    var ex = list.find(function(t){return t.id===existingId;}) || {id:'', label:''};
    m.querySelector('#mTitle').textContent=isNew?'إضافة تبويب':'تعديل تبويب';
    m.querySelector('#mBody').innerHTML='<label class="field">معرف التبويب (إنجليزي)<input id="fId" value="'+esc(ex.id)+'" '+(isNew?'':'readonly')+'></label><label class="field">اسم التبويب<input id="fLabel" value="'+esc(ex.label)+'"></label>';
    m.classList.add('open');
    m.querySelector('#mSave').onclick=async function(){
      var id=document.getElementById('fId').value.trim().toLowerCase().replace(/\s+/g,'_');
      var label=document.getElementById('fLabel').value.trim();
      if(!id||!label){ m.querySelector('#mErr').textContent='اكمل البيانات'; return; }
      if(!/^[a-z0-9_-]+$/.test(id)){ m.querySelector('#mErr').textContent='المعرف إنجليزي فقط'; return; }
      if(isNew && list.some(function(t){return t.id===id;})){ m.querySelector('#mErr').textContent='المعرف موجود'; return; }
      if(isNew) list.push({id:id, label:label}); else { var idx=list.findIndex(function(t){return t.id===id;}); if(idx>-1) list[idx].label=label; }
      cfg.subjectTabs[subId]=list;
      var ok=await saveCfg(cfg);
      if(ok){ m.classList.remove('open'); toast('تم الحفظ'); renderList(); } else m.querySelector('#mErr').textContent='فشل الحفظ';
    };
  }

  (async function(){
    cfg=await loadCfg();
    subjectsList=await loadSubjects();
    renderSelect();
    renderList();
    document.getElementById('subjSelect').onchange=renderList;
    document.getElementById('btnAddTab').onclick=function(){ openModal(null); };
  })();
})();