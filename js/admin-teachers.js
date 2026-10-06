/* إدارة المعلمين - أدمن فقط - يضيف ويمسح ملفات بس */
(function(){
  var box = document.getElementById('teachersBox');
  if(!box) return;
  var esc=function(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});};

  var subjectsList = [];
  var teachers = [];

  async function checkAdmin(){
    try{
      var r=await fetch('/api/session',{credentials:'same-origin',cache:'no-store'});
      var j=await r.json();
      if(!j.admin){ box.innerHTML='<div class="center-box"><div class="a-card"><h1>ممنوع</h1><p>إدارة المعلمين للأدمن فقط - سجل دخول كأدمن من /admin</p><a class="btn btn-navy" href="../index.html">دخول</a></div></div>'; return false; }
      return true;
    }catch(e){ return false; }
  }

  async function loadSubjects(){
    try{
      // من ملفك النهائي data/content.js
      if(window.SITE && window.SITE.subjects){
        subjectsList = Object.keys(window.SITE.subjects).map(function(k){
          var s=window.SITE.subjects[k]; return {id:s.id||k, name:s.name||k, icon:s.icon||'📚'};
        });
      } else {
        var r=await fetch('/api/admin-data?type=subjects',{cache:'no-store'});
        if(r.ok){ var d=await r.json(); var subs=d.subjects||{}; subjectsList=Object.keys(subs).map(function(k){return {id:k,name:subs[k].name||k,icon:subs[k].icon||'📚'};}); }
      }
    }catch(e){}
    if(!subjectsList.length){
      subjectsList=[
        {id:'islamic',name:'التربية الإسلامية',icon:'🕌'},
        {id:'arabic',name:'اللغة العربية',icon:'📖'},
        {id:'english',name:'اللغة الإنجليزية',icon:'🇬🇧'},
        {id:'math',name:'الرياضيات',icon:'📐'},
        {id:'chemistry',name:'الكيمياء',icon:'🧪'},
        {id:'physics',name:'الفيزياء',icon:'⚛️'},
        {id:'biology',name:'الأحياء',icon:'🧬'},
        {id:'history',name:'التاريخ',icon:'🏛️'},
        {id:'geography',name:'الجغرافيا',icon:'🗺️'}
      ];
    }
  }

  async function loadTeachers(){
    try{
      var r=await fetch('/api/teachers',{credentials:'same-origin',cache:'no-store'});
      if(r.ok){ var j=await r.json(); teachers=j.teachers||[]; }
    }catch(e){ teachers=[]; }
  }

  function toast(msg){
    var t=document.querySelector('.toast'); if(!t){ t=document.createElement('div'); t.className='toast'; document.body.appendChild(t); }
    t.textContent=msg; t.classList.add('show'); setTimeout(function(){t.classList.remove('show');},3000);
  }

  function subjectsCheckboxes(selected){
    selected=selected||[];
    var html='<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;max-height:200px;overflow-y:auto;padding:8px;border:1px solid var(--line);border-radius:12px">';
    subjectsList.forEach(function(s){
      var checked=selected.includes(s.id)?'checked':'';
      html+='<label style="display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer"><input type="checkbox" value="'+esc(s.id)+'" '+checked+'> '+esc(s.icon)+' '+esc(s.name)+'</label>';
    });
    html+='</div><small style="color:var(--muted);font-size:11px">المعلم هيقدر يضيف ويمسح ملفات بس في المواد المختارة</small>';
    return html;
  }

  function render(){
    var html='<div class="wrap" style="padding:24px"><div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px"><h2>👨‍🏫 إدارة المعلمين</h2><button class="btn btn-navy btn-sm" id="btnAdd">+ إضافة معلم</button></div>';
    html+='<p style="color:var(--muted);font-size:13px;margin:8px 0">المعلم: يضيف ويمسح ملفات بس - ممنوع يعدل اسم المادة أو الغلاف</p>';
    html+='<div style="display:grid;gap:12px;margin-top:18px">';
    if(!teachers.length){ html+='<div style="text-align:center;padding:30px;color:var(--muted)">لا يوجد معلمين بعد - اضغط إضافة معلم</div>'; }
    teachers.forEach(function(t){
      var subs=(t.subjects||[]).map(function(id){ var f=subjectsList.find(function(s){return s.id===id}); return f? f.name : id; }).join('، ')||'—';
      html+='<div class="f-card" style="display:flex;justify-content:space-between;align-items:center"><div><b>'+esc(t.name||t.username)+'</b><br><small style="color:var(--muted)">username: '+esc(t.username)+' | مواد: '+esc(subs)+'</small></div><div style="display:flex;gap:6px"><button class="btn btn-ghost btn-sm" data-edit="'+esc(t.id)+'">✏️ تعديل</button><button class="btn btn-danger btn-sm" data-del="'+esc(t.id)+'">🗑️ حذف</button></div></div>';
    });
    html+='</div></div>';

    // مودال
    html+='<div class="modal" id="tModal"><div class="m-box" role="dialog"><button class="m-x">✕</button><h3 id="tTitle">إضافة معلم</h3><label class="field">اسم المستخدم (انجليزي بدون مسافات)<input id="tUsername" placeholder="chem_teacher"></label><label class="field">الاسم الظاهر<input id="tName" placeholder="أ. عبدالحميد الخن"></label><label class="field">كلمة المرور<input id="tPass" type="password" placeholder="••••••••"><small style="color:var(--muted)">عند التعديل اتركها فاضية لو مش عايز تغيرها</small></label><label class="field">المواد المسموحة</label><div id="tSubs"></div><p class="err" id="tErr"></p><div class="m-act"><button class="btn btn-navy" id="tSave">حفظ</button><button class="btn btn-ghost" data-x>إلغاء</button></div></div></div>';
    box.innerHTML=html;

    box.querySelector('#btnAdd').onclick=function(){ openModal(null); };
    box.querySelectorAll('[data-edit]').forEach(function(b){ b.onclick=function(){ var id=b.getAttribute('data-edit'); var t=teachers.find(function(x){return x.id===id}); openModal(t); }; });
    box.querySelectorAll('[data-del]').forEach(function(b){ b.onclick=async function(){ var id=b.getAttribute('data-del'); if(!confirm('حذف المعلم؟')) return; var r=await fetch('/api/teachers',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify({action:'delete',teacher:{id:id}})}); if(r.ok){ toast('تم الحذف'); await loadTeachers(); render(); } }; });

    // مودال أحداث
    var modal=box.querySelector('#tModal');
    modal.querySelector('.m-x').onclick=function(){ modal.classList.remove('open'); };
    modal.querySelector('[data-x]').onclick=function(){ modal.classList.remove('open'); };
    modal.onclick=function(e){ if(e.target===modal) modal.classList.remove('open'); };
  }

  function openModal(t){
    var modal=document.getElementById('tModal');
    var isNew=!t;
    document.getElementById('tTitle').textContent=isNew?'إضافة معلم':'تعديل معلم';
    document.getElementById('tUsername').value=t?t.username:'';
    document.getElementById('tName').value=t?t.name:'';
    document.getElementById('tPass').value='';
    document.getElementById('tSubs').innerHTML=subjectsCheckboxes(t?t.subjects:[]);
    document.getElementById('tErr').textContent='';
    modal.classList.add('open');
    document.getElementById('tSave').onclick=async function(){
      var username=document.getElementById('tUsername').value.trim().toLowerCase();
      var name=document.getElementById('tName').value.trim();
      var pass=document.getElementById('tPass').value;
      var checked=Array.prototype.slice.call(document.querySelectorAll('#tSubs input:checked')).map(function(i){return i.value;});
      var err=document.getElementById('tErr');
      if(!username){ err.textContent='اكتب اسم المستخدم'; return; }
      if(!/^[a-z0-9_-]+$/.test(username)){ err.textContent='اسم المستخدم انجليزي فقط بدون مسافات'; return; }
      if(isNew && !pass){ err.textContent='اكتب كلمة مرور'; return; }
      if(!checked.length){ err.textContent='اختر مادة واحدة على الأقل'; return; }
      var payload={action:isNew?'create':'update', teacher:{id:t?t.id:undefined, username:username, name:name, subjects:checked}};
      if(pass) payload.teacher.password=pass;
      if(isNew) payload.teacher.password=pass;
      var r=await fetch('/api/teachers',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify(payload)});
      var j=await r.json();
      if(!r.ok){ err.textContent=j.error||'فشل الحفظ'; return; }
      modal.classList.remove('open');
      toast(isNew?'تم إضافة المعلم':'تم التعديل');
      await loadTeachers(); render();
    };
  }

  (async function(){
    if(!await checkAdmin()) return;
    await loadSubjects();
    await loadTeachers();
    render();
  })();
})();