/* الصفحة الرئيسية - تحكم كامل للأدمن: بطاقات المديرين + لوحة الشرف */
(function(){
  var S = window.SITE || {};
  var R = '';
  var esc = function(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); };
  var src = function(p){ return !p ? 'assets/img/avatar.jpg' : (/^(https?:)?\/\//.test(p) ? p : p); };
  var fb = ' onerror="this.onerror=null;this.src=\'assets/img/avatar.jpg\'"';
  
  var isAdmin = false;
  var data = null; // { leaders, honor, about, offers, about stat }

  function toast(msg){
    var t=document.querySelector('.toast'); if(!t){ t=document.createElement('div'); t.className='toast'; document.body.appendChild(t); }
    t.textContent=msg; t.classList.add('show'); setTimeout(function(){ t.classList.remove('show'); },3000);
  }

  async function checkAdmin(){
    try{ var r=await fetch('/api/session',{credentials:'same-origin',cache:'no-store'}); if(r.ok){ var j=await r.json(); isAdmin=!!j.admin; } }catch(e){}
    if(isAdmin){
      var badge=document.createElement('div'); badge.className='admin-badge';
      badge.innerHTML='<span class="dot"></span> وضع التعديل - الصفحة الرئيسية';
      document.body.appendChild(badge);
    }
  }

  async function loadData(){
    try{
      var r=await fetch('/api/home',{cache:'no-store'});
      if(r.ok){ var j=await r.json(); if(j && (j.leaders||j.honor)){ return j; } }
    }catch(e){}
    return { leaders: S.leaders||[], honor: S.honor||[], about: S.about||{}, offers: S.offers||[], offersTitle: S.offersTitle, offersSub: S.offersSub };
  }

  async function saveAll(){
    try{
      var r=await fetch('/api/home',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify(data)});
      if(r.ok){ toast('تم الحفظ ✓'); return true; }
      throw new Error(await r.text());
    }catch(e){ toast('فشل الحفظ: '+e.message); return false; }
  }

  async function uploadPhoto(file){
    if(!file) return null;
    var fd=new FormData(); fd.append('file',file); fd.append('name',file.name);
    var r=await fetch('/api/upload-staff-photo',{method:'POST',body:fd,credentials:'same-origin'});
    if(!r.ok) throw new Error(await r.text());
    var j=await r.json(); return j.url;
  }

  function renderLeaders(){
    var el=document.getElementById('leaders'); if(!el||!data.leaders) return;
    var L=data.leaders;
    var row = L.length>=3 ? [L[1], L[0], L[2]] : L;
    el.innerHTML = row.map(function(p, idx){
      var realIdx = L.length>=3 ? (idx===0?1:idx===1?0:2) : idx;
      var main = realIdx===0;
      var adminBtn = isAdmin ? '<div class="l-admin"><button class="btn btn-ghost btn-sm" data-edit-leader="'+realIdx+'">تعديل</button><button class="btn btn-danger btn-sm" data-del-leader="'+realIdx+'">حذف</button></div>' : '';
      return '<article class="person '+(main?'principal':'')+'"><div class="p-media"><img src="'+esc(src(p.photo))+'" alt="'+esc(p.name)+'"'+fb+'></div><div class="p-body"><span class="role '+(main?'principal-role':'gold')+'">'+esc(p.role)+'</span><h3>'+esc(p.name)+'</h3><p class="p-text">'+esc(p.text||'')+'</p>'+adminBtn+'</div></article>';
    }).join('') + (isAdmin ? '<button class="add-leader" id="btnAddLeader"><span class="plus">+</span>إضافة مدير</button>' : '');
    
    if(isAdmin){
      el.querySelectorAll('[data-edit-leader]').forEach(function(b){ b.onclick=function(){ openLeaderModal(parseInt(b.getAttribute('data-edit-leader'))); }; });
      el.querySelectorAll('[data-del-leader]').forEach(function(b){ b.onclick=function(){ var i=parseInt(b.getAttribute('data-del-leader')); if(confirm('حذف '+data.leaders[i].name+'؟')){ data.leaders.splice(i,1); renderLeaders(); saveAll(); } }; });
      var addBtn=document.getElementById('btnAddLeader'); if(addBtn) addBtn.onclick=function(){ openLeaderModal(null); };
    }
  }

  function renderHonor(){
    var track=document.getElementById('track'); if(!track||!data.honor) return;
    track.innerHTML = data.honor.map(function(h, i){
      var adminBtn = isAdmin ? '<div class="h-admin"><button data-edit-honor="'+i+'">✏️</button><button class="del" data-del-honor="'+i+'">🗑️</button></div>' : '';
      return '<article class="h-card"><img src="'+esc(src(h.photo))+'" alt="'+esc(h.name)+'"'+fb+'><div class="h-meta"><div><b>'+esc(h.name)+'</b><small>'+esc(h.grade||'')+'</small></div><span class="score">'+esc(h.score||'')+'</span></div>'+adminBtn+'</article>';
    }).join('') + (isAdmin ? '<button class="h-card add-honor" id="btnAddHonor" style="display:grid;place-items:center;min-height:260px;border:2px dashed rgba(255,255,255,.3);background:transparent"><span style="font-size:32px">+</span><span>إضافة طالب</span></button>' : '');
    
    if(isAdmin){
      track.querySelectorAll('[data-edit-honor]').forEach(function(b){ b.onclick=function(){ openHonorModal(parseInt(b.getAttribute('data-edit-honor'))); }; });
      track.querySelectorAll('[data-del-honor]').forEach(function(b){ b.onclick=function(){ var i=parseInt(b.getAttribute('data-del-honor')); if(confirm('حذف '+data.honor[i].name+'؟')){ data.honor.splice(i,1); renderHonor(); saveAll(); } }; });
      var addBtn=document.getElementById('btnAddHonor'); if(addBtn) addBtn.onclick=function(){ openHonorModal(null); };
    }
    
    // أسهم التمرير (موجودة أصلا في main.js لكن نضمنها)
    var prev=document.getElementById('prev'), next=document.getElementById('next');
    if(prev&&next&&track){
      prev.onclick=function(){ track.scrollBy({left:280,behavior:'smooth'}); };
      next.onclick=function(){ track.scrollBy({left:-280,behavior:'smooth'}); };
    }
  }

  function renderAbout(){
    var aboutEl=document.getElementById('about-text');
    if(aboutEl && data.about){
      aboutEl.innerHTML = '<h2 class="sec-title">'+esc(data.about.title||'من نحن')+'</h2><p>'+esc(data.about.text||'')+'</p><div class="stat"><div class="n">'+esc((data.about.stat||{}).number||'')+'</div><div><b>'+esc((data.about.stat||{}).title||'')+'</b><span>'+esc((data.about.stat||{}).text||'')+'</span></div></div>' + (isAdmin ? '<button class="btn btn-ghost btn-sm" id="btnEditAbout" style="margin-top:12px">تعديل من نحن</button>' : '');
      if(isAdmin){ var b=document.getElementById('btnEditAbout'); if(b) b.onclick=function(){ openAboutModal(); }; }
    }
    var offersHead=document.getElementById('offers-head');
    if(offersHead){
      offersHead.innerHTML = '<h2 class="sec-title">'+esc(data.offersTitle||'ماذا نقدم')+'</h2><p class="sec-sub">'+esc(data.offersSub||'')+'</p>' + (isAdmin ? '<button class="btn btn-ghost btn-sm" id="btnEditOffers" style="margin-top:8px">تعديل ماذا نقدم</button>' : '');
      if(isAdmin){ var bo=document.getElementById('btnEditOffers'); if(bo) bo.onclick=function(){ openOffersModal(); }; }
    }
    var offersEl=document.getElementById('offers');
    if(offersEl && data.offers){
      offersEl.innerHTML = data.offers.map(function(o){ return '<article class="offer"><div class="o-ico">'+esc(o.icon||'')+'</div><h4>'+esc(o.title||'')+'</h4><p>'+esc(o.text||'')+'</p></article>'; }).join('');
    }
  }

  // مودالات
  var editModal=null;
  function ensureModal(){
    if(editModal) return editModal;
    editModal=document.createElement('div'); editModal.className='modal'; editModal.id='homeEditModal';
    editModal.innerHTML='<div class="m-box" style="max-width:540px"><button class="m-x">✕</button><h3 id="emTitle"></h3><div id="emBody" style="margin-top:14px"></div><p class="err" id="emErr"></p><div class="m-act"><button class="btn btn-navy" id="emSave">حفظ</button><button class="btn btn-ghost" id="emCancel">إلغاء</button></div></div>';
    document.body.appendChild(editModal);
    editModal.querySelector('.m-x').onclick=function(){ editModal.classList.remove('open'); };
    editModal.querySelector('#emCancel').onclick=function(){ editModal.classList.remove('open'); };
    editModal.onclick=function(e){ if(e.target===editModal) editModal.classList.remove('open'); };
    return editModal;
  }

  function openLeaderModal(idx){
    var m=ensureModal(); var isNew=idx===null; var l=isNew?{role:'',name:'',photo:'',text:''}:data.leaders[idx];
    m.querySelector('#emTitle').textContent=isNew?'إضافة مدير':'تعديل مدير - '+l.name;
    m.querySelector('#emBody').innerHTML='<label class="field">المسمى الوظيفي<input id="fRole" value="'+esc(l.role)+'"></label><label class="field">الاسم<input id="fName" value="'+esc(l.name)+'"></label><label class="field">الكلمة/النص<textarea id="fText" rows="4" style="padding:12px 14px;border:1.5px solid var(--line);border-radius:14px;width:100%;font:inherit">'+esc(l.text||'')+'</textarea></label><label class="field">رابط الصورة<input id="fPhoto" value="'+esc(l.photo||'')+'"></label><label class="field">أو ارفع صورة<input type="file" id="fFile" accept="image/*"></label><img id="fPrev" src="'+esc(src(l.photo))+'" style="width:80px;height:80px;border-radius:12px;object-fit:cover;margin:10px auto;display:'+(l.photo?'block':'none')+'">';
    m.classList.add('open');
    document.getElementById('fFile').onchange=function(e){ var file=e.target.files[0]; if(file){ var url=URL.createObjectURL(file); var img=document.getElementById('fPrev'); img.src=url; img.style.display='block'; } };
    m.querySelector('#emSave').onclick=async function(){
      var role=document.getElementById('fRole').value.trim(); var name=document.getElementById('fName').value.trim(); var text=document.getElementById('fText').value.trim(); var photo=document.getElementById('fPhoto').value.trim(); var file=document.getElementById('fFile').files[0];
      if(!name){ document.getElementById('emErr').textContent='اكتب الاسم'; return; }
      try{
        if(file){ document.getElementById('emErr').textContent='جاري رفع الصورة...'; photo=await uploadPhoto(file); }
        var obj={role:role,name:name,text:text,photo:photo};
        if(isNew) data.leaders.push(obj); else data.leaders[idx]=obj;
        m.classList.remove('open'); renderLeaders(); await saveAll();
      }catch(err){ document.getElementById('emErr').textContent='فشل: '+err.message; }
    };
  }

  function openHonorModal(idx){
    var m=ensureModal(); var isNew=idx===null; var h=isNew?{name:'',grade:'',score:'',photo:''}:data.honor[idx];
    m.querySelector('#emTitle').textContent=isNew?'إضافة طالب للوحة الشرف':'تعديل طالب';
    m.querySelector('#emBody').innerHTML='<label class="field">اسم الطالب<input id="fHName" value="'+esc(h.name)+'"></label><label class="field">الصف<input id="fHGrade" value="'+esc(h.grade||'')+'" placeholder="الثاني عشر علمي"></label><label class="field">النسبة<input id="fHScore" value="'+esc(h.score||'')+'" placeholder="99.2%"></label><label class="field">رابط الصورة<input id="fHPhoto" value="'+esc(h.photo||'')+'"></label><label class="field">أو ارفع صورة<input type="file" id="fHFile" accept="image/*"></label><img id="fHPrev" src="'+esc(src(h.photo))+'" style="width:80px;height:100px;object-fit:cover;margin:10px auto;display:'+(h.photo?'block':'none')+'">';
    m.classList.add('open');
    document.getElementById('fHFile').onchange=function(e){ var file=e.target.files[0]; if(file){ var url=URL.createObjectURL(file); var img=document.getElementById('fHPrev'); img.src=url; img.style.display='block'; } };
    m.querySelector('#emSave').onclick=async function(){
      var name=document.getElementById('fHName').value.trim(); var grade=document.getElementById('fHGrade').value.trim(); var score=document.getElementById('fHScore').value.trim(); var photo=document.getElementById('fHPhoto').value.trim(); var file=document.getElementById('fHFile').files[0];
      if(!name){ document.getElementById('emErr').textContent='اكتب اسم الطالب'; return; }
      try{
        if(file){ document.getElementById('emErr').textContent='جاري رفع الصورة...'; photo=await uploadPhoto(file); }
        var obj={name:name,grade:grade,score:score,photo:photo};
        if(isNew) data.honor.push(obj); else data.honor[idx]=obj;
        m.classList.remove('open'); renderHonor(); await saveAll();
      }catch(err){ document.getElementById('emErr').textContent='فشل: '+err.message; }
    };
  }

  function openAboutModal(){
    var m=ensureModal(); var a=data.about||{};
    m.querySelector('#emTitle').textContent='تعديل من نحن';
    m.querySelector('#emBody').innerHTML='<label class="field">العنوان<input id="fATitle" value="'+esc(a.title||'')+'"></label><label class="field">النص<textarea id="fAText" rows="4" style="padding:12px 14px;border:1.5px solid var(--line);border-radius:14px;width:100%;font:inherit">'+esc(a.text||'')+'</textarea></label><label class="field">رقم الإحصائية<input id="fANum" value="'+esc((a.stat||{}).number||'')+'"></label><label class="field">عنوان الإحصائية<input id="fATitle2" value="'+esc((a.stat||{}).title||'')+'"></label><label class="field">نص الإحصائية<input id="fAText2" value="'+esc((a.stat||{}).text||'')+'"></label>';
    m.classList.add('open');
    m.querySelector('#emSave').onclick=async function(){
      data.about={ title:document.getElementById('fATitle').value.trim(), text:document.getElementById('fAText').value.trim(), stat:{ number:document.getElementById('fANum').value.trim(), title:document.getElementById('fATitle2').value.trim(), text:document.getElementById('fAText2').value.trim() } };
      m.classList.remove('open'); renderAbout(); await saveAll();
    };
  }

  function openOffersModal(){
    var m=ensureModal();
    m.querySelector('#emTitle').textContent='تعديل ماذا نقدم';
    var html='<label class="field">العنوان<input id="fOTitle" value="'+esc(data.offersTitle||'')+'"></label><label class="field">الوصف<input id="fOSub" value="'+esc(data.offersSub||'')+'"></label>';
    (data.offers||[]).forEach(function(o,i){
      html+='<hr style="margin:16px 0"><label class="field">عرض '+(i+1)+' - الأيقونة<input id="fOIcon'+i+'" value="'+esc(o.icon||'')+'"></label><label class="field">العنوان<input id="fOT'+i+'" value="'+esc(o.title||'')+'"></label><label class="field">النص<input id="fOText'+i+'" value="'+esc(o.text||'')+'"></label>';
    });
    m.querySelector('#emBody').innerHTML=html;
    m.classList.add('open');
    m.querySelector('#emSave').onclick=async function(){
      data.offersTitle=document.getElementById('fOTitle').value.trim();
      data.offersSub=document.getElementById('fOSub').value.trim();
      data.offers.forEach(function(o,i){
        o.icon=document.getElementById('fOIcon'+i).value.trim();
        o.title=document.getElementById('fOT'+i).value.trim();
        o.text=document.getElementById('fOText'+i).value.trim();
      });
      m.classList.remove('open'); renderAbout(); await saveAll();
    };
  }

  (async function(){
    data=await loadData();
    await checkAdmin();
    renderLeaders();
    renderHonor();
    renderAbout();
  })();
})();