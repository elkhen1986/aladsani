/* لوحة تحكم الأدمن والمعلمين - المعلم يضيف ويمسح ملفات بس */
(function(){
  var box = document.getElementById('adminBox');
  if(!box) return;
  var esc=function(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});};

  async function checkSession(){
    try{
      var r=await fetch('/api/session',{credentials:'same-origin',cache:'no-store'});
      if(r.ok) return await r.json();
    }catch(e){}
    return {admin:false, teacher:false, authed:false};
  }

  function renderLogin(err){
    box.innerHTML='<h1>دخول المشرفين والمعلمين</h1><p>أدخل اسم المستخدم وكلمة المرور</p>'+
      (err?'<div class="err" style="color:#c62f2f;background:#fdecec;padding:10px 14px;border-radius:12px;margin:12px 0">'+esc(err)+'</div>':'')+
      '<form id="loginForm" style="margin-top:18px;text-align:start"><label class="field">اسم المستخدم<input id="username" value="admin" autocomplete="username" placeholder="admin"></label><label class="field">كلمة المرور<input id="pw" type="password" required autocomplete="current-password" placeholder="••••••••"></label><p class="err" id="err"></p><button class="btn btn-navy" type="submit">دخول</button></form>'+
      '<p style="margin-top:14px;font-size:12px;color:var(--muted)">الأدمن: username = admin + كلمة سر ADMIN_PASSWORD<br>المعلم: username = اللي عمله الأدمن في إدارة المعلمين</p>';
    document.getElementById('loginForm').onsubmit=async function(e){
      e.preventDefault();
      var u=document.getElementById('username').value.trim();
      var p=document.getElementById('pw').value;
      var errEl=document.getElementById('err');
      errEl.textContent='';
      if(!u||!p){ errEl.textContent='اكمل البيانات'; return; }
      try{
        var r=await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify({username:u,password:p})});
        var j=await r.json();
        if(!r.ok) throw new Error(j.error==='bad_credentials'?'اسم المستخدم أو كلمة المرور خطأ':j.error||'فشل الدخول');
        location.reload();
      }catch(err){ errEl.textContent=err.message; }
    };
  }

  function renderDashboard(session){
    if(session.role==='admin'){
      box.innerHTML='<h1>مرحبا بك أدمن العدساني 👋</h1><p style="color:var(--muted)">تحكم كامل</p>'+
        '<div style="display:grid;gap:12px;margin-top:20px;text-align:start">'+
        '<a class="btn btn-navy" href="subjects/index.html">📚 إدارة المواد - إضافة/تعديل/حذف + صور الأغلفة</a>'+
        '<a class="btn btn-gold" href="tabs/index.html">🗂 إدارة التبويبات داخل كل مادة</a>'+
        '<a class="btn btn-gold" href="teachers/index.html" style="background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff">👨‍🏫 إدارة المعلمين - إضافة معلم وصلاحياته</a>'+
        '<a class="btn btn-ghost" href="../staff/index.html">👨🏫 إدارة الهيئة التعليمية</a>'+
        '<a class="btn btn-ghost" href="../index.html">🏠 الصفحة الرئيسية</a>'+
        '<button class="btn btn-danger" id="logout" style="margin-top:12px">تسجيل خروج</button></div>';
    }else if(session.role==='teacher'){
      var subs=(session.subjects||[]).join('، ')||'—';
      box.innerHTML='<h1>مرحبا '+esc(session.name||session.username)+' 👨‍🏫</h1><p>موادك: <b>'+esc(subs)+'</b></p>'+
        '<div style="margin-top:14px;background:#d1ecf1;border:1px solid #bee5eb;padding:12px 14px;border-radius:14px;color:#0c5460;font-size:13px">يمكنك <b>إضافة وحذف ملفات فقط</b> من داخل صفحات موادك.<br>لا يمكنك تعديل اسم المادة أو الغلاف أو التبويبات.</div>'+
        '<div style="display:grid;gap:10px;margin-top:18px"><a class="btn btn-navy" href="../index.html">🏠 الذهاب للمواد</a><button class="btn btn-danger" id="logout">تسجيل خروج</button></div>';
    }
    var lo=document.getElementById('logout'); if(lo) lo.onclick=async function(){ await fetch('/api/logout',{method:'POST',credentials:'same-origin'}); location.reload(); };
  }

  (async function(){
    var s=await checkSession();
    if(s.authed) renderDashboard(s); else renderLogin();
  })();
})();