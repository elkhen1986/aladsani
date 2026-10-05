/* الهيئة التعليمية - تحكم كامل + مربع حوار موحد بدل رسائل النظام + بطاقات تكبر */
(function () {
  var S = window.SITE || {};
  var R = document.currentScript ? document.currentScript.getAttribute('data-root') || '' : '';
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var src = function (p) { return !p ? R + 'assets/img/avatar.jpg' : (/^(https?:)?\/\//.test(p) ? p : R + p); };
  var fb = ' onerror="this.onerror=null;this.src=\'' + R + 'assets/img/avatar.jpg\'"';
  
  var isAdmin = false;
  var data = null;
  var deptsEl = document.getElementById('depts');
  var leadRowEl = document.getElementById('leadRow');
  
  function toast(msg){
    var t = document.querySelector('.toast');
    if(!t){ t=document.createElement('div'); t.className='toast'; document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('show'); setTimeout(function(){ t.classList.remove('show'); }, 3000);
  }

  function platformConfirm(title, message, danger){
    if(window.PlatformDialog && window.PlatformDialog.confirm){
      return window.PlatformDialog.confirm({title:title, message:message, danger:!!danger, confirmText: danger ? 'حذف' : 'تأكيد', cancelText:'إلغاء'});
    }
    return Promise.resolve(confirm(message));
  }

  async function checkAdmin(){
    try{
      var r = await fetch('/api/session', { credentials:'same-origin', cache:'no-store' });
      if(r.ok){ var j = await r.json(); isAdmin = !!j.admin; }
    }catch(e){ isAdmin = false; }
    if(isAdmin){
      var badge = document.createElement('div');
      badge.className = 'admin-badge';
      badge.innerHTML = '<span class="dot"></span> وضع التعديل مفعّل - يمكنك التعديل مباشرة';
      document.body.appendChild(badge);
      var topActions = document.createElement('div');
      topActions.className = 'wrap';
      topActions.style.cssText = 'padding:12px 24px;display:flex;gap:10px;flex-wrap:wrap;';
      topActions.innerHTML = '<button class="btn btn-navy btn-sm" id="btnEditLeaders">تعديل الإدارة</button><button class="btn btn-gold btn-sm" id="btnAddDept">+ إضافة قسم جديد</button><button class="btn btn-ghost btn-sm" id="btnSaveAll">💾 حفظ التغييرات</button>';
      if(deptsEl) deptsEl.parentElement.insertBefore(topActions, deptsEl);
      setTimeout(function(){
        var b1 = document.getElementById('btnEditLeaders'); if(b1) b1.onclick = function(){ openLeadersModal(); };
        var b2 = document.getElementById('btnAddDept'); if(b2) b2.onclick = function(){ openDeptModal(null); };
        var b3 = document.getElementById('btnSaveAll'); if(b3) b3.onclick = saveAll;
      }, 100);
    }
  }

  async function loadData(){
    try{
      var r = await fetch('/api/staff', { cache:'no-store' });
      if(r.ok){
        var j = await r.json();
        if(j && j.departments && j.departments.length){ data = j; return j; }
      }
    }catch(e){}
    data = { leaders: S.leaders || [], departments: S.departments || [], honor: S.honor || [] };
    return data;
  }

  async function saveAll(){
    if(!isAdmin) return;
    try{
      var r = await fetch('/api/staff', { method:'POST', headers:{'Content-Type':'application/json'}, credentials:'same-origin', body: JSON.stringify(data) });
      if(r.ok){ toast('تم الحفظ بنجاح ✓'); return true; }
      throw new Error(await r.text());
    }catch(e){ toast('فشل الحفظ: ' + e.message); return false; }
  }

  // لايت بوكس للمعلمين (للطلاب)
  var teacherLB=null;
  function ensureTeacherLB(){
    if(teacherLB) return teacherLB;
    teacherLB=document.createElement('div');
    teacherLB.className='modal';
    teacherLB.innerHTML='<div class="m-box lb" style="max-width:400px;text-align:center"><button class="m-x">✕</button><img id="tLbImg" style="width:120px;height:120px;border-radius:50%;object-fit:cover;margin:0 auto 14px;border:4px solid var(--gold-2)"><h3 id="tLbName"></h3><p id="tLbSub" style="color:var(--muted);font-weight:700;margin-top:4px"></p><p id="tLbBio" style="color:var(--muted);margin-top:8px;font-size:14px"></p></div>';
    document.body.appendChild(teacherLB);
    teacherLB.querySelector('.m-x').onclick=function(){ teacherLB.classList.remove('open'); };
    teacherLB.onclick=function(e){ if(e.target===teacherLB) teacherLB.classList.remove('open'); };
    document.addEventListener('keydown',function(e){ if(e.key==='Escape') teacherLB.classList.remove('open'); });
    return teacherLB;
  }

  function openTeacherLB(t){
    var m=ensureTeacherLB();
    var img=m.querySelector('#tLbImg');
    img.src=src(t.photo); img.style.display='block'; img.onerror=function(){ this.style.display='none'; };
    m.querySelector('#tLbName').textContent=t.name||'';
    m.querySelector('#tLbSub').textContent=t.subject||'';
    m.querySelector('#tLbBio').textContent=t.bio||'';
    m.querySelector('#tLbBio').style.display=t.bio?'block':'none';
    m.classList.add('open');
  }

  function renderLeaders(){
    if(!leadRowEl || !data.leaders) return;
    var L = data.leaders;
    var row = L.length>=3 ? [L[1], L[0], L[2]] : L;
    leadRowEl.innerHTML = row.map(function(p, idx){
      var realIdx = L.length>=3 ? (idx===0?1:idx===1?0:2) : idx;
      var main = realIdx===0;
      var adminBtn = isAdmin ? '<button class="btn btn-ghost btn-sm" style="margin-top:8px" data-edit-leader="'+realIdx+'">تعديل</button>' : '';
      return '<article class="person ' + (main?'main-p':'side') + '"><div class="p-media"><img src="' + esc(src(p.photo)) + '" alt="' + esc(p.name) + '"' + fb + '></div>' +
        '<div class="p-body"><span class="role' + (main?'':' gold') + '">' + esc(p.role) + '</span><h3>' + esc(p.name) + '</h3><p class="p-text">' + esc(p.text||'') + '</p>' + adminBtn + '</div></article>';
    }).join('');
    if(isAdmin){
      leadRowEl.querySelectorAll('[data-edit-leader]').forEach(function(btn){
        btn.onclick = function(){ openLeaderModal(parseInt(btn.getAttribute('data-edit-leader'))); };
      });
    }
  }

  function renderDepts(){
    if(!deptsEl) return;
    deptsEl.innerHTML = data.departments.map(function(d, di){
      var h = d.head || {};
      var headPhoto = h.photo ? '<img src="' + esc(src(h.photo)) + '" alt="' + esc(h.name) + '" loading="lazy"' + fb + '>' : '';
      var headAdmin = isAdmin ? '<div class="head-admin"><button class="btn btn-ghost btn-sm" data-act="edit-dept" data-di="'+di+'">تعديل القسم</button><button class="btn btn-ghost btn-sm" data-act="edit-head" data-di="'+di+'">تعديل الرئيس</button><button class="btn btn-danger btn-sm" data-act="del-dept" data-di="'+di+'">حذف القسم</button></div>' : '';
      var teachersHtml = (d.teachers||[]).map(function(t, ti){
        var tPhoto = t.photo ? '<img src="' + esc(src(t.photo)) + '" alt="' + esc(t.name) + '" loading="lazy"' + fb + '>' : '👤';
        var tAdmin = isAdmin ? '<div class="t-actions"><button data-act="edit-teacher" data-di="'+di+'" data-ti="'+ti+'">✏️</button><button class="del" data-act="del-teacher" data-di="'+di+'" data-ti="'+ti+'">🗑️</button></div>' : '';
        return '<article class="t-card ' + (isAdmin?'is-admin':'') + '" data-dept="'+di+'" data-teacher="'+ti+'" tabindex="0" role="button"><div class="t-img">' + tPhoto + '</div><b>' + esc(t.name) + '</b><small>' + esc(t.subject||'') + '</small>' + tAdmin + '</article>';
      }).join('');
      var addBtn = isAdmin ? '<button class="add-teacher" data-act="add-teacher" data-di="'+di+'"><span class="plus">+</span>إضافة معلم</button>' : '';
      return '<section class="dept"><h2 class="dept-title">' + esc(d.name) + '</h2><div class="dept-grid"><article class="head-card"><div class="hm">' + (headPhoto || '<div style="display:grid;place-items:center;height:100%;font-size:40px;color:#fff;">👨‍🏫</div>') + '</div><div class="hb"><h3>' + esc(h.name||'') + '</h3><p>' + esc(h.bio||'') + '</p>' + headAdmin + '</div></article><div class="teachers">' + teachersHtml + addBtn + '</div></div></section>';
    }).join('');
    bindDeptEvents();
    bindTeacherLightbox();
  }

  function bindDeptEvents(){
    if(!isAdmin) return;
    deptsEl.querySelectorAll('[data-act="edit-dept"]').forEach(function(btn){
      btn.onclick = function(){ openDeptModal(parseInt(btn.getAttribute('data-di'))); };
    });
    deptsEl.querySelectorAll('[data-act="edit-head"]').forEach(function(btn){
      btn.onclick = function(){ openHeadModal(parseInt(btn.getAttribute('data-di'))); };
    });
    deptsEl.querySelectorAll('[data-act="del-dept"]').forEach(function(btn){
      btn.onclick = async function(){
        var di=parseInt(btn.getAttribute('data-di'));
        var ok = await platformConfirm('حذف القسم', 'هل تريد حذف قسم "'+esc(data.departments[di].name)+'" بكل معلميه؟ لا يمكن التراجع.', true);
        if(ok){ data.departments.splice(di,1); renderDepts(); saveAll(); }
      };
    });
    deptsEl.querySelectorAll('[data-act="add-teacher"]').forEach(function(btn){
      btn.onclick = function(){ openTeacherModal(parseInt(btn.getAttribute('data-di')), null); };
    });
    deptsEl.querySelectorAll('[data-act="edit-teacher"]').forEach(function(btn){
      btn.onclick = function(e){ e.stopPropagation(); openTeacherModal(parseInt(btn.getAttribute('data-di')), parseInt(btn.getAttribute('data-ti'))); };
    });
    deptsEl.querySelectorAll('[data-act="del-teacher"]').forEach(function(btn){
      btn.onclick = async function(e){ 
        e.stopPropagation(); 
        var di=parseInt(btn.getAttribute('data-di')), ti=parseInt(btn.getAttribute('data-ti')); 
        var ok = await platformConfirm('حذف المعلم', 'هل تريد حذف المعلم '+esc(data.departments[di].teachers[ti].name)+'؟', true);
        if(ok){ data.departments[di].teachers.splice(ti,1); renderDepts(); saveAll(); } 
      };
    });
  }

  function bindTeacherLightbox(){
    // للطلاب فقط (أو للأدمن لما يضغط على الصورة نفسها)
    var cards = deptsEl.querySelectorAll('.t-card');
    cards.forEach(function(card){
      // لو أدمن وعنده أزرار تعديل، لا نفتح بالضغط العادي عشان ما يتداخل، لكن نفتح لو ضغط على الصورة
      card.onclick = function(e){
        if(e.target.closest('.t-actions') || e.target.closest('[data-act]')) return;
        if(isAdmin){
          // للأدمن: الضغط يفتح العرض الكبير، التعديل من زر القلم
          var di=parseInt(card.getAttribute('data-dept')), ti=parseInt(card.getAttribute('data-teacher'));
          var t=data.departments[di].teachers[ti];
          openTeacherLB(t);
          return;
        }
        var di=parseInt(card.getAttribute('data-dept')), ti=parseInt(card.getAttribute('data-teacher'));
        var t=data.departments[di].teachers[ti];
        openTeacherLB(t);
      };
      card.onkeydown = function(e){ if(e.key==='Enter' || e.key===' '){ e.preventDefault(); card.click(); } };
    });
  }

  var editModal = null;
  function ensureEditModal(){
    if(editModal) return editModal;
    editModal = document.createElement('div');
    editModal.className = 'modal';
    editModal.id = 'adminEditModal';
    editModal.innerHTML = '<div class="m-box" style="max-width:520px"><button class="m-x">✕</button><h3 id="emTitle"></h3><div id="emBody" style="margin-top:14px"></div><p class="err" id="emErr"></p><div class="m-act"><button class="btn btn-navy" id="emSave">حفظ</button><button class="btn btn-ghost" id="emCancel">إلغاء</button></div></div>';
    document.body.appendChild(editModal);
    editModal.querySelector('.m-x').onclick = function(){ editModal.classList.remove('open'); };
    editModal.querySelector('#emCancel').onclick = function(){ editModal.classList.remove('open'); };
    editModal.onclick = function(e){ if(e.target===editModal) editModal.classList.remove('open'); };
    return editModal;
  }

  async function uploadPhoto(file){
    if(!file) return null;
    var fd = new FormData();
    fd.append('file', file);
    fd.append('name', file.name);
    var r = await fetch('/api/upload-staff-photo', { method:'POST', body: fd, credentials:'same-origin' });
    if(!r.ok){ var txt = await r.text(); throw new Error(txt); }
    var j = await r.json();
    return j.url;
  }

  function openDeptModal(di){
    var m = ensureEditModal();
    var isNew = di===null;
    var dept = isNew ? { name:'', head:{name:'',photo:'',bio:''}, teachers:[] } : data.departments[di];
    m.querySelector('#emTitle').textContent = isNew ? 'إضافة قسم جديد' : 'تعديل القسم';
    m.querySelector('#emBody').innerHTML = '<label class="field">اسم القسم<input type="text" id="fDeptName" value="'+esc(dept.name)+'" placeholder="مثال: قسم الكيمياء"></label>';
    m.classList.add('open');
    m.querySelector('#emSave').onclick = async function(){
      var name = document.getElementById('fDeptName').value.trim();
      if(!name){ document.getElementById('emErr').textContent='اكتب اسم القسم'; return; }
      if(isNew){ data.departments.push({ name:name, head:{name:'أ. ',photo:'',bio:''}, teachers:[] }); }
      else { data.departments[di].name = name; }
      m.classList.remove('open'); renderDepts(); await saveAll();
    };
  }

  function openHeadModal(di){
    var m = ensureEditModal();
    var head = data.departments[di].head || {};
    m.querySelector('#emTitle').textContent = 'تعديل رئيس القسم - ' + data.departments[di].name;
    m.querySelector('#emBody').innerHTML = '<label class="field">الاسم<input type="text" id="fHeadName" value="'+esc(head.name||'')+'"></label><label class="field">النبذة<textarea id="fHeadBio" rows="3" style="padding:12px 14px;border:1.5px solid var(--line);border-radius:14px;width:100%;font:inherit">'+esc(head.bio||'')+'</textarea></label><label class="field">رابط الصورة<input type="text" id="fHeadPhoto" value="'+esc(head.photo||'')+'" placeholder="assets/img/..."></label><label class="field">أو ارفع صورة جديدة<input type="file" id="fHeadFile" accept="image/*"></label><img id="fHeadPrev" style="width:80px;height:80px;border-radius:50%;object-fit:cover;margin:10px auto;display:'+(head.photo?'block':'none')+'" src="'+esc(src(head.photo))+'">';
    m.classList.add('open');
    document.getElementById('fHeadFile').onchange = function(e){ var file=e.target.files[0]; if(file){ var url=URL.createObjectURL(file); var img=document.getElementById('fHeadPrev'); img.src=url; img.style.display='block'; } };
    m.querySelector('#emSave').onclick = async function(){
      var name = document.getElementById('fHeadName').value.trim();
      var bio = document.getElementById('fHeadBio').value.trim();
      var photo = document.getElementById('fHeadPhoto').value.trim();
      var file = document.getElementById('fHeadFile').files[0];
      try{
        if(file){ document.getElementById('emErr').textContent='جاري رفع الصورة...'; photo = await uploadPhoto(file); }
        data.departments[di].head = { name:name, bio:bio, photo:photo };
        m.classList.remove('open'); renderDepts(); await saveAll();
      }catch(err){ document.getElementById('emErr').textContent='فشل رفع الصورة: '+err.message; }
    };
  }

  function openTeacherModal(di, ti){
    var m = ensureEditModal();
    var isNew = ti===null;
    var t = isNew ? { name:'', subject:'', photo:'' } : data.departments[di].teachers[ti];
    m.querySelector('#emTitle').textContent = isNew ? 'إضافة معلم - '+data.departments[di].name : 'تعديل معلم';
    m.querySelector('#emBody').innerHTML = '<label class="field">الاسم<input type="text" id="fTName" value="'+esc(t.name||'')+'"></label><label class="field">المادة/التخصص<input type="text" id="fTSub" value="'+esc(t.subject||'')+'" placeholder="مثال: معلم كيمياء"></label><label class="field">رابط الصورة<input type="text" id="fTPhoto" value="'+esc(t.photo||'')+'"></label><label class="field">أو ارفع صورة<input type="file" id="fTFile" accept="image/*"></label><img id="fTPrev" style="width:80px;height:80px;border-radius:50%;object-fit:cover;margin:10px auto;display:'+(t.photo?'block':'none')+'" src="'+esc(src(t.photo))+'">';
    m.classList.add('open');
    document.getElementById('fTFile').onchange = function(e){ var file=e.target.files[0]; if(file){ var url=URL.createObjectURL(file); var img=document.getElementById('fTPrev'); img.src=url; img.style.display='block'; } };
    m.querySelector('#emSave').onclick = async function(){
      var name = document.getElementById('fTName').value.trim();
      var sub = document.getElementById('fTSub').value.trim();
      var photo = document.getElementById('fTPhoto').value.trim();
      var file = document.getElementById('fTFile').files[0];
      if(!name){ document.getElementById('emErr').textContent='اكتب اسم المعلم'; return; }
      try{
        if(file){ document.getElementById('emErr').textContent='جاري رفع الصورة...'; photo = await uploadPhoto(file); }
        var obj = { name:name, subject:sub, photo:photo };
        if(isNew) data.departments[di].teachers.push(obj); else data.departments[di].teachers[ti]=obj;
        m.classList.remove('open'); renderDepts(); await saveAll();
      }catch(err){ document.getElementById('emErr').textContent='فشل: '+err.message; }
    };
  }

  function openLeaderModal(idx){
    var m = ensureEditModal();
    var l = data.leaders[idx];
    m.querySelector('#emTitle').textContent = 'تعديل الإدارة - '+l.role;
    m.querySelector('#emBody').innerHTML = '<label class="field">الدور/المسمى<input type="text" id="fLRole" value="'+esc(l.role||'')+'"></label><label class="field">الاسم<input type="text" id="fLName" value="'+esc(l.name||'')+'"></label><label class="field">النص/الكلمة<textarea id="fLText" rows="4" style="padding:12px 14px;border:1.5px solid var(--line);border-radius:14px;width:100%;font:inherit">'+esc(l.text||'')+'</textarea></label><label class="field">رابط الصورة<input type="text" id="fLPhoto" value="'+esc(l.photo||'')+'"></label><label class="field">أو ارفع صورة<input type="file" id="fLFile" accept="image/*"></label><img id="fLPrev" style="width:80px;height:80px;border-radius:12px;object-fit:cover;margin:10px auto;display:'+(l.photo?'block':'none')+'" src="'+esc(src(l.photo))+'">';
    m.classList.add('open');
    document.getElementById('fLFile').onchange = function(e){ var file=e.target.files[0]; if(file){ var url=URL.createObjectURL(file); var img=document.getElementById('fLPrev'); img.src=url; img.style.display='block'; } };
    m.querySelector('#emSave').onclick = async function(){
      var role = document.getElementById('fLRole').value.trim();
      var name = document.getElementById('fLName').value.trim();
      var text = document.getElementById('fLText').value.trim();
      var photo = document.getElementById('fLPhoto').value.trim();
      var file = document.getElementById('fLFile').files[0];
      try{
        if(file){ document.getElementById('emErr').textContent='جاري رفع الصورة...'; photo = await uploadPhoto(file); }
        data.leaders[idx] = { role:role, name:name, text:text, photo:photo };
        m.classList.remove('open'); renderLeaders(); renderDepts(); await saveAll();
      }catch(err){ document.getElementById('emErr').textContent='فشل: '+err.message; }
    };
  }

  function openLeadersModal(){
    var m = ensureEditModal();
    m.querySelector('#emTitle').textContent = 'اختر من تريد تعديله';
    var html = data.leaders.map(function(l,i){ return '<button class="btn btn-ghost" style="width:100%;margin-top:8px;justify-content:flex-start" data-leader-idx="'+i+'">'+esc(l.role)+' - '+esc(l.name)+'</button>'; }).join('');
    m.querySelector('#emBody').innerHTML = html;
    m.classList.add('open');
    m.querySelectorAll('[data-leader-idx]').forEach(function(btn){ btn.onclick = function(){ m.classList.remove('open'); openLeaderModal(parseInt(btn.getAttribute('data-leader-idx'))); }; });
    m.querySelector('#emSave').style.display='none';
    setTimeout(function(){ m.querySelector('#emSave').style.display=''; }, 500);
  }

  (async function(){
    await loadData();
    await checkAdmin();
    renderLeaders();
    renderDepts();
  })();
})();