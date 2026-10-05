/* إدارة المواد والتبويبات - صفحة الأدمن الكاملة */
(function(){
  var esc=function(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});};
  function toast(m){ var t=document.querySelector('.toast'); if(!t){ t=document.createElement('div'); t.className='toast'; document.body.appendChild(t);} t.textContent=m; t.classList.add('show'); setTimeout(function(){t.classList.remove('show');},3000); }
  function platformConfirm(title,msg,danger){ if(window.PlatformDialog&&window.PlatformDialog.confirm) return window.PlatformDialog.confirm({title:title,message:msg,danger:!!danger}); return Promise.resolve(confirm(msg)); }

  var GRADES=[
    {id:'10', name:'الصف العاشر'},
    {id:'11-science', name:'الحادي عشر علمي'},
    {id:'11-arts', name:'الحادي عشر أدبي'},
    {id:'12-science', name:'الثاني عشر علمي'},
    {id:'12-arts', name:'الثاني عشر أدبي'},
  ];
  var data=null;

  async function load(){ var r=await fetch('/api/subjects',{cache:'no-store'}); if(r.ok) return await r.json(); return {subjects:{}, gradeSubjects:{}, covers:{}}; }
  async function save(d){ var r=await fetch('/api/subjects',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify(d)}); return r.ok; }
  async function uploadCover(file){ var fd=new FormData(); fd.append('file',file); fd.append('name',file.name); var r=await fetch('/api/upload-subject-cover',{method:'POST',body:fd,credentials:'same-origin'}); if(!r.ok) throw new Error(await r.text()); var j=await r.json(); return j.url; }

  function render(){
    var wrap=document.getElementById('grades'); wrap.innerHTML='';
    GRADES.forEach(function(g){
      var sec=document.createElement('section'); sec.style.marginTop='32px';
      sec.innerHTML='<h2 style="font-weight:900;color:var(--navy);display:flex;align-items:center;gap:10px">'+esc(g.name)+' <span class="badge">'+((data.gradeSubjects[g.id]||[]).length)+' مواد</span></h2><div class="grid" id="grid-'+g.id+'"></div><button class="btn btn-ghost btn-sm" data-add-grade="'+g.id+'" style="margin-top:12px">+ إضافة مادة لهذا الصف</button>';
      wrap.appendChild(sec);
      var grid=sec.querySelector('#grid-'+g.id);
      (data.gradeSubjects[g.id]||[]).forEach(function(subId){
        var sub=data.subjects[subId]; if(!sub) return;
        var card=document.createElement('div'); card.className='card';
        card.innerHTML='<div style="width:100%;height:120px;border-radius:12px;overflow:hidden;background:#eef2f9;display:grid;place-items:center">'+(sub.cover?'<img src="'+esc(sub.cover)+'" style="width:100%;height:100%;object-fit:cover">':'<span style="font-size:40px">'+esc(sub.icon||'📚')+'</span>')+'</div><h3>'+esc(sub.name)+'</h3><p>'+esc(sub.id)+'</p><div class="actions"><button class="btn btn-ghost btn-sm" data-edit="'+esc(subId)+'">تعديل</button><button class="btn btn-danger btn-sm" data-del="'+esc(subId)+'">حذف</button></div>';
        grid.appendChild(card);
      });
    });
    bind();
  }

  function bind(){
    document.querySelectorAll('[data-add-grade]').forEach(function(b){ b.onclick=function(){ openModal(null, b.getAttribute('data-add-grade')); }; });
    document.querySelectorAll('[data-edit]').forEach(function(b){ b.onclick=function(){ openModal(b.getAttribute('data-edit')); }; });
    document.querySelectorAll('[data-del]').forEach(function(b){
      b.onclick=async function(){
        var id=b.getAttribute('data-del');
        var ok=await platformConfirm('حذف المادة','هل تريد حذف مادة "'+esc((data.subjects[id]||{}).name||id)+'" نهائيا من كل الصفوف؟',true);
        if(!ok) return;
        delete data.subjects[id];
        Object.keys(data.gradeSubjects).forEach(function(g){ data.gradeSubjects[g]=data.gradeSubjects[g].filter(function(s){return s!==id;}); });
        if(data.covers) delete data.covers[id];
        await save(data); toast('تم الحذف'); location.reload();
      };
    });
  }

  var modal=null;
  function ensureModal(){
    if(modal) return modal;
    modal=document.createElement('div'); modal.className='modal';
    modal.innerHTML='<div class="m-box" style="max-width:520px"><button class="m-x">✕</button><h3 id="mTitle"></h3><div id="mBody" style="margin-top:14px"></div><p class="err" id="mErr"></p><div class="m-act"><button class="btn btn-navy" id="mSave">حفظ</button><button class="btn btn-ghost" id="mCancel">إلغاء</button></div></div>';
    document.body.appendChild(modal);
    modal.querySelector('.m-x').onclick=function(){modal.classList.remove('open');};
    modal.querySelector('#mCancel').onclick=function(){modal.classList.remove('open');};
    modal.onclick=function(e){ if(e.target===modal) modal.classList.remove('open'); };
    return modal;
  }

  function openModal(subId, presetGrade){
    var m=ensureModal();
    var isNew=!subId;
    var sub = isNew?{id:'', name:'', icon:'📚', cover:'', hue:200, grades: presetGrade?[presetGrade]:[]} : (data.subjects[subId]||{id:subId, name:'', icon:'📚', cover:'', hue:200});
    m.querySelector('#mTitle').textContent=isNew?'إضافة مادة جديدة':'تعديل مادة';
    var gradesChecks = GRADES.map(function(g){ var checked = (data.gradeSubjects[g.id]||[]).includes(sub.id) || (presetGrade===g.id); return '<label style="display:flex;align-items:center;gap:6px;margin:4px 0"><input type="checkbox" value="'+g.id+'" '+(checked?'checked':'')+'> '+esc(g.name)+'</label>'; }).join('');
    m.querySelector('#mBody').innerHTML=
      '<label class="field">معرف المادة (إنجليزي)<input id="fId" value="'+esc(sub.id)+'" '+(isNew?'':'readonly')+' placeholder="physics2"></label>'+
      '<label class="field">اسم المادة<input id="fName" value="'+esc(sub.name)+'" placeholder="الفيزياء المتقدمة"></label>'+
      '<label class="field">أيقونة<input id="fIcon" value="'+esc(sub.icon||'📚')+'"></label>'+
      '<label class="field">لون (0-360)<input type="number" id="fHue" value="'+(sub.hue||200)+'"></label>'+
      '<label class="field">رابط الصورة<input id="fCover" value="'+esc(sub.cover||'')+'"></label>'+
      '<label class="field">أو ارفع صورة<input type="file" id="fFile" accept="image/*"></label>'+
      '<div class="field"><b>الصفوف التي تظهر فيها:</b><div style="margin-top:6px">'+gradesChecks+'</div></div>'+
      '<img id="fPrev" src="'+esc(sub.cover||'')+'" style="width:100%;height:160px;object-fit:cover;border-radius:12px;display:'+(sub.cover?'block':'none')+';margin-top:10px">';
    m.classList.add('open');
    document.getElementById('fFile').onchange=function(e){ var f=e.target.files[0]; if(f){ var u=URL.createObjectURL(f); var img=document.getElementById('fPrev'); img.src=u; img.style.display='block'; } };
    m.querySelector('#mSave').onclick=async function(){
      var id=document.getElementById('fId').value.trim().toLowerCase().replace(/\s+/g,'-');
      var name=document.getElementById('fName').value.trim();
      var icon=document.getElementById('fIcon').value.trim()||'📚';
      var hue=parseInt(document.getElementById('fHue').value)||200;
      var cover=document.getElementById('fCover').value.trim();
      var file=document.getElementById('fFile').files[0];
      var checkedGrades=Array.prototype.slice.call(m.querySelectorAll('input[type=checkbox]:checked')).map(function(c){return c.value;});
      if(!id||!name){ m.querySelector('#mErr').textContent='اكمل المعرف والاسم'; return; }
      try{
        if(file){ m.querySelector('#mErr').textContent='جاري رفع الصورة...'; cover=await uploadCover(file); }
        data.subjects=data.subjects||{}; data.gradeSubjects=data.gradeSubjects||{}; data.covers=data.covers||{};
        data.subjects[id]={id:id, name:name, icon:icon, hue:hue, cover:cover};
        if(cover) data.covers[id]=cover; else delete data.covers[id];
        // حدث الصفوف
        GRADES.forEach(function(g){
          var has=checkedGrades.includes(g.id);
          var arr=data.gradeSubjects[g.id]||[];
          if(has){ if(!arr.includes(id)) arr.push(id); } else { arr=arr.filter(function(s){return s!==id;}); }
          data.gradeSubjects[g.id]=arr;
        });
        var ok=await save(data);
        if(ok){ m.classList.remove('open'); toast('تم الحفظ ✓'); location.reload(); }
        else m.querySelector('#mErr').textContent='فشل الحفظ';
      }catch(e){ m.querySelector('#mErr').textContent='فشل: '+e.message; }
    };
  }

  (async function(){
    data=await load();
    render();
    document.getElementById('btnAdd').onclick=function(){ openModal(null); };
    document.getElementById('btnTabs').onclick=function(){ window.open('../tabs/index.html','_blank'); };
  })();
})();