/* لوحة تحكم الأدمن - دخول فقط (بدون إدارة مشرفين) */
(function(){
  var box = document.getElementById('adminBox');
  if(!box) return;
  var esc=function(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});};

  function renderLogin(err){
    box.innerHTML='<h1>دخول المشرف</h1><p>أدخل كلمة المرور لإدارة الملفات والمواد والتبويبات</p>'+
      (err?'<div class="err" style="color:#c62f2f;background:#fdecec;padding:10px 14px;border-radius:12px;margin:12px 0">'+esc(err)+'</div>':'')+
      '<form id="loginForm"><label class="field">كلمة المرور<input type="password" id="pw" required></label><button class="btn btn-navy" type="submit">دخول</button></form>';
    document.getElementById('loginForm').onsubmit=async function(e){
      e.preventDefault();
      var pw=document.getElementById('pw').value;
      try{
        var r=await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify({password:pw})});
        if(!r.ok) throw new Error('كلمة المرور غير صحيحة');
        location.reload();
      }catch(err){ renderLogin(err.message); }
    };
  }

  function renderDashboard(){
    box.innerHTML='<h1>مرحبا بك في وحدة التحكم</h1><p style="color:var(--muted);margin-top:6px">تم تسجيل الدخول بنجاح</p>'+
      '<div style="margin-top:20px">'+
      '<button class="btn btn-danger" id="logout">تسجيل خروج</button>'+
      '</div>';
    document.getElementById('logout').onclick=async function(){ 
      await fetch('/api/logout',{method:'POST',credentials:'same-origin'}); 
      location.reload(); 
    };
  }

  (async function(){
    try{
      var r=await fetch('/api/session',{credentials:'same-origin',cache:'no-store'});
      var j=await r.json();
      if(j.admin) renderDashboard(); else renderLogin();
    }catch(e){ renderLogin(); }
  })();
})();