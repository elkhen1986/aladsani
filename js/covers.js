/* صفحة الفصل - تحكم كامل في المواد: إضافة/تعديل/حذف + صور الأغلفة */
(function(){
  var isAdmin=false;
  var subjectsData=null; // من /api/subjects
  var esc=function(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});};
  var S = window.SITE||{};
  var rootEl=document.querySelector('.subjects');
  if(!rootEl) return;

  function toast(msg){ var t=document.querySelector('.toast'); if(!t){ t=document.createElement('div'); t.className='toast'; document.body.appendChild(t);} t.textContent=msg; t.classList.add('show'); setTimeout(function(){t.classList.remove('show');},3000); }
  function platformConfirm(title, message, danger){
    if(window.PlatformDialog && window.PlatformDialog.confirm){ return window.PlatformDialog.confirm({title:title, message:message, danger:!!danger}); }
    return Promise.resolve(confirm(message));
  }

  async function checkAdmin(){
    try{ var r=await fetch('/api/session',{credentials:'same-origin',cache:'no-store'}); if(r.ok){ var j=await r.json(); isAdmin=!!j.admin; } }catch(e){}
    if(isAdmin){
      var badge=document.createElement('div'); badge.className='admin-badge'; badge.innerHTML='<span class="dot"></span> وضع تعديل المواد - إضافة/حذف/صورة';
      document.body.appendChild(badge);
      var wrap=document.createElement('div'); wrap.className='wrap'; wrap.style.padding='12px 24px'; wrap.innerHTML='<button class="btn btn-navy btn-sm" id="btnAddSubj">+ إضافة مادة جديدة</button><button class="btn btn-ghost btn-sm" id="btnManageSubj">⚙️ إدارة المواد</button>';
      rootEl.parentElement.insertBefore(wrap, rootEl);
      setTimeout(function(){
        document.getElementById('btnAddSubj').onclick=function(){ openSubjModal(null); };
        document.getElementById('btnManageSubj').onclick=function(){ openManageModal(); };
      },100);
    }
  }

  async function loadSubjects(){
    try{
      var r=await fetch('/api/subjects',{cache:'no-store'});
      if(r.ok){ var j=await r.json(); subjectsData=j; return j; }
    }catch(e){}
    return {subjects:{}, gradeSubjects:{}, covers:{}};
  }
  async function saveSubjects(data){
    var r=await fetch('/api/subjects',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify(data)});
    return r.ok;
  }
  async function uploadCover(file){
    var fd=new FormData(); fd.append('file',file); fd.append('name',file.name);
    var r=await fetch('/api/upload-subject-cover',{method:'POST',body:fd,credentials:'same-origin'});
    if(!r.ok) throw new Error(await r.text());
    var j=await r.json(); return j.url;
  }

  // دمج المواد الأصلية مع المخصصة
  function getGradeFromPath(){
    var m=location.pathname.match(/\/(10|11-science|11-arts|12-science|12-arts)\//);
    return m?m[1]:null;
  }
  function renderCustomSubjects(){
    if(!isAdmin && (!subjectsData || !Object.keys(subjectsData.subjects||{}).length)) return;
    var grade = getGradeFromPath();
    if(!grade) return;
    var gradeSubs = (subjectsData.gradeSubjects && subjectsData.gradeSubjects[grade]) || [];
    gradeSubs.forEach(function(subId){
      var sub = (subjectsData.subjects||{})[subId];
      if(!sub) return;
      // لو المادة موجودة أصلا في الصفحة لا نكرر
      if(rootEl.querySelector('[data-s="'+subId+'"]')) return;
      var card=document.createElement('a');
      card.className='subj custom-subj'; card.href=subId+'/index.html'; card.setAttribute('data-s',subId);
      card.style.setProperty('--h', sub.hue||95);
      var coverHtml = sub.cover ? '<img src="'+esc(sub.cover)+'" style="width:100%;height:100%;object-fit:cover">' : '<span class="emo">'+esc(sub.icon||'📚')+'</span>';
      card.innerHTML='<div class="cover" aria-hidden="true">'+coverHtml+'</div><span class="badge">'+esc(grade)+'</span><h3>'+esc(sub.name)+'</h3>'+(isAdmin?'<div style="position:absolute;top:6px;left:6px;display:flex;gap:4px"><button class="btn btn-ghost btn-sm" data-edit-sub="'+esc(subId)+'">✏️</button><button class="btn btn-danger btn-sm" data-del-sub="'+esc(subId)+'">🗑️</button></div>':'');
      rootEl.appendChild(card);
    });
    if(isAdmin) bindCustomEvents();
  }

  function bindCustomEvents(){
    rootEl.querySelectorAll('[data-edit-sub]').forEach(function(b){
      b.onclick=function(e){ e.preventDefault(); e.stopPropagation(); openSubjModal(b.getAttribute('data-edit-sub')); };
    });
    rootEl.querySelectorAll('[data-del-sub]').forEach(function(b){
      b.onclick=async function(e){
        e.preventDefault(); e.stopPropagation();
        var id=b.getAttribute('data-del-sub');
        var ok=await platformConfirm('حذف المادة','هل تريد حذف مادة "'+esc((subjectsData.subjects[id]||{}).name||id)+'" نهائيا؟',true);
        if(!ok) return;
        delete subjectsData.subjects[id];
        Object.keys(subjectsData.gradeSubjects||{}).forEach(function(g){ subjectsData.gradeSubjects[g]=(subjectsData.gradeSubjects[g]||[]).filter(function(s){return s!==id;}); });
        await saveSubjects(subjectsData);
        toast('تم حذف المادة'); location.reload();
      };
    });
    // تعديل المواد الأصلية أيضا
    rootEl.querySelectorAll('.subj:not(.custom-subj)').forEach(function(card){
      var subId=card.getAttribute('data-s');
      if(!card.querySelector('.subj-admin')){
        var adminDiv=document.createElement('div'); adminDiv.className='subj-admin'; adminDiv.style.cssText='position:absolute;top:6px;left:6px;display:flex;gap:4px;z-index:2';
        adminDiv.innerHTML='<button class="btn btn-ghost btn-sm" data-edit-orig="'+esc(subId)+'">✏️</button>';
        card.style.position='relative'; card.appendChild(adminDiv);
        adminDiv.querySelector('[data-edit-orig]').onclick=function(e){ e.preventDefault(); e.stopPropagation(); openSubjModal(subId,true); };
      }
    });
  }

  var subjModal=null;
  function ensureModal(){
    if(subjModal) return subjModal;
    subjModal=document.createElement('div'); subjModal.className='modal';
    subjModal.innerHTML='<div class="m-box" style="max-width:520px"><button class="m-x">✕</button><h3 id="subjMTitle"></h3><div id="subjMBody" style="margin-top:14px"></div><p class="err" id="subjMErr"></p><div class="m-act"><button class="btn btn-navy" id="subjMSave">حفظ</button><button class="btn btn-ghost" id="subjMCancel">إلغاء</button></div></div>';
    document.body.appendChild(subjModal);
    subjModal.querySelector('.m-x').onclick=function(){subjModal.classList.remove('open');};
    subjModal.querySelector('#subjMCancel').onclick=function(){subjModal.classList.remove('open');};
    subjModal.onclick=function(e){ if(e.target===subjModal) subjModal.classList.remove('open'); };
    return subjModal;
  }

  function openSubjModal(subId, isOrig){
    var m=ensureModal();
    var isNew=!subId;
    var sub = isNew ? {id:'', name:'', icon:'📚', cover:'', hue:200} : (subjectsData.subjects[subId] || {id:subId, name: (S.subjects&&S.subjects[subId]?S.subjects[subId].name:subId), icon:'📚', cover:'', hue:200});
    // لو مادة أصلية وليست في subjectsData، نجيب اسمها من الصفحة
    if(isOrig && !subjectsData.subjects[subId]){
      var card=document.querySelector('[data-s="'+subId+'"] h3');
      if(card) sub.name=card.textContent.trim();
    }
    m.querySelector('#subjMTitle').textContent=isNew?'إضافة مادة جديدة':'تعديل مادة - '+sub.name;
    m.querySelector('#subjMBody').innerHTML=
      '<label class="field">معرف المادة (بالإنجليزية، مثال: chemistry2)<input id="subjId" value="'+esc(sub.id||'')+'" '+(isNew?'':'readonly')+' placeholder="chemistry"></label>'+
      '<label class="field">اسم المادة<input id="subjName" value="'+esc(sub.name||'')+'" placeholder="الكيمياء المتقدمة"></label>'+
      '<label class="field">الأيقونة (إيموجي)<input id="subjIcon" value="'+esc(sub.icon||'📚')+'"></label>'+
      '<label class="field">لون الغلاف (0-360)<input type="number" id="subjHue" value="'+esc(sub.hue||200)+'"></label>'+
      '<label class="field">رابط صورة الغلاف<input id="subjCover" value="'+esc(sub.cover||'')+'" placeholder="https://..."></label>'+
      '<label class="field">أو ارفع صورة غلاف<input type="file" id="subjFile" accept="image/*"></label>'+
      '<img id="subjPrev" src="'+esc(sub.cover||'')+'" style="width:100%;height:160px;object-fit:cover;border-radius:12px;margin:10px auto;display:'+(sub.cover?'block':'none')+'">';
    m.classList.add('open');
    document.getElementById('subjFile').onchange=function(e){ var f=e.target.files[0]; if(f){ var url=URL.createObjectURL(f); var img=document.getElementById('subjPrev'); img.src=url; img.style.display='block'; } };
    m.querySelector('#subjMSave').onclick=async function(){
      var id=document.getElementById('subjId').value.trim().toLowerCase().replace(/\s+/g,'-');
      var name=document.getElementById('subjName').value.trim();
      var icon=document.getElementById('subjIcon').value.trim()||'📚';
      var hue=parseInt(document.getElementById('subjHue').value)||200;
      var cover=document.getElementById('subjCover').value.trim();
      var file=document.getElementById('subjFile').files[0];
      if(!id||!name){ m.querySelector('#subjMErr').textContent='اكمل المعرف والاسم'; return; }
      if(!/^[a-z0-9-]+$/.test(id)){ m.querySelector('#subjMErr').textContent='المعرف يجب أن يكون إنجليزي بدون مسافات'; return; }
      try{
        if(file){ m.querySelector('#subjMErr').textContent='جاري رفع الصورة...'; cover=await uploadCover(file); }
        subjectsData.subjects=subjectsData.subjects||{}; subjectsData.gradeSubjects=subjectsData.gradeSubjects||{}; subjectsData.covers=subjectsData.covers||{};
        subjectsData.subjects[id]={id:id, name:name, icon:icon, hue:hue, cover:cover};
        if(cover) subjectsData.covers[id]=cover;
        // أضف للصف الحالي
        var grade=getGradeFromPath();
        if(grade){
          subjectsData.gradeSubjects[grade]=subjectsData.gradeSubjects[grade]||[];
          if(!subjectsData.gradeSubjects[grade].includes(id)) subjectsData.gradeSubjects[grade].push(id);
        }
        var ok=await saveSubjects(subjectsData);
        if(ok){ m.classList.remove('open'); toast('تم حفظ المادة ✓'); location.reload(); }
        else m.querySelector('#subjMErr').textContent='فشل الحفظ';
      }catch(e){ m.querySelector('#subjMErr').textContent='فشل: '+e.message; }
    };
  }

  function openManageModal(){
    var m=ensureModal();
    var grade=getGradeFromPath();
    var list = (subjectsData.gradeSubjects[grade]||[]).map(function(id){ return subjectsData.subjects[id]; }).filter(Boolean);
    var html='<p style="color:var(--muted);font-size:13px">المواد في هذا الصف - اسحب لإعادة الترتيب</p><div id="manageList">';
    list.forEach(function(s){ html+='<div class="f-card" data-mid="'+esc(s.id)+'" draggable="true" style="cursor:grab"><span>☰</span><b style="margin-inline-start:8px">'+esc(s.name)+'</b><small style="margin-inline-start:auto">'+esc(s.id)+'</small><button class="btn btn-ghost btn-sm" data-medit="'+esc(s.id)+'">✏️</button><button class="btn btn-danger btn-sm" data-mdel="'+esc(s.id)+'">🗑️</button></div>'; });
    html+='</div>';
    m.querySelector('#subjMTitle').textContent='إدارة مواد '+grade;
    m.querySelector('#subjMBody').innerHTML=html;
    m.querySelector('#subjMSave').style.display='none'; m.querySelector('#subjMCancel').textContent='إغلاق';
    m.classList.add('open');
    var container=m.querySelector('#manageList');
    var dragSrc=null;
    container.querySelectorAll('[data-mid]').forEach(function(card){
      card.addEventListener('dragstart', function(e){ dragSrc=card; setTimeout(function(){card.classList.add('dragging');},0); });
      card.addEventListener('dragend', function(){ card.classList.remove('dragging'); });
      card.addEventListener('dragover', function(e){ e.preventDefault(); card.classList.add('drag-over'); });
      card.addEventListener('dragleave', function(){ card.classList.remove('drag-over'); });
      card.addEventListener('drop', function(e){ e.preventDefault(); card.classList.remove('drag-over'); if(dragSrc&&dragSrc!==card){ var cards=Array.prototype.slice.call(container.querySelectorAll('[data-mid]')); var s=cards.indexOf(dragSrc), t=cards.indexOf(card); if(s<t) card.parentNode.insertBefore(dragSrc, card.nextSibling); else card.parentNode.insertBefore(dragSrc, card); saveOrder(); } });
    });
    container.querySelectorAll('[data-medit]').forEach(function(b){ b.onclick=function(){ var id=b.getAttribute('data-medit'); m.classList.remove('open'); openSubjModal(id); }; });
    container.querySelectorAll('[data-mdel]').forEach(function(b){
      b.onclick=async function(){
        var id=b.getAttribute('data-mdel');
        var ok=await platformConfirm('حذف المادة','حذف "'+id+'"؟',true);
        if(!ok) return;
        delete subjectsData.subjects[id];
        subjectsData.gradeSubjects[grade]=subjectsData.gradeSubjects[grade].filter(function(s){return s!==id;});
        await saveSubjects(subjectsData); b.closest('[data-mid]').remove(); toast('تم الحذف'); setTimeout(function(){location.reload();},500);
      };
    });
    async function saveOrder(){
      var newOrder=Array.prototype.slice.call(container.querySelectorAll('[data-mid]')).map(function(c){return c.getAttribute('data-mid');});
      subjectsData.gradeSubjects[grade]=newOrder;
      await saveSubjects(subjectsData); toast('تم حفظ الترتيب');
    }
  }

  (async function(){
    await checkAdmin();
    subjectsData=await loadSubjects();
    // لو في كفرات مخصصة، طبقها على البطاقات الموجودة
    if(subjectsData.covers){
      Object.keys(subjectsData.covers).forEach(function(id){
        var card=document.querySelector('[data-s="'+id+'"] .cover');
        if(card && subjectsData.covers[id]){
          card.innerHTML='<img src="'+esc(subjectsData.covers[id])+'" style="width:100%;height:100%;object-fit:cover">';
        }
      });
    }
    renderCustomSubjects();
  })();
})();