/* لوحة تحكم الأدمن - مع روابط إدارة المواد والتبويبات والترتيب */
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
    box.innerHTML='<h1>مرحبا بك مشرف العدساني</h1><p style="color:var(--muted)">تحكم كامل بدون تعديل باقي المنصة</p>'+
      '<div style="display:grid;gap:12px;margin-top:20px;text-align:start">'+
      '<a class="btn btn-navy" href="subjects/index.html">📚 إدارة المواد - إضافة/تعديل/حذف + صور الأغلفة</a>'+
      '<a class="btn btn-gold" href="tabs/index.html">🗂️ إدارة التبويبات داخل كل مادة - إضافة/حذف/ترتيب بالسحب</a>'+
      '<a class="btn btn-ghost" href="../staff/index.html">👨‍🏫 إدارة الهيئة التعليمية</a>'+
      '<a class="btn btn-ghost" href="../index.html">🏠 الصفحة الرئيسية - إدارة المدراء والفائقين</a>'+
      '<div style="margin-top:12px;padding:14px;background:#f1f5fb;border-radius:14px"><b>ملاحظات التحكم الجديد:</b><ul style="margin:8px 0 0 16px;list-style:disc;font-size:13px;color:var(--muted)"><li>ترتيب الملفات: ادخل أي مادة كأدمن واسحب البطاقات ☰ فوق بعض - يحفظ تلقائيا</li><li>المواد: من زر إدارة المواد تقدر تضيف مادة جديدة لكل الصفوف مع صورة غلاف</li><li>التبويبات: من داخل المادة كأدمن اضغط ⚙️ إدارة التبويبات أو من صفحة إدارة التبويبات العامة</li><li>كل التعديلات تحفظ في R2 بدون ما تغير باقي المنصة</li></ul></div>'+
      '<button class="btn btn-danger" id="logout" style="margin-top:12px">تسجيل خروج</button>'+
      '</div>';
    document.getElementById('logout').onclick=async function(){ await fetch('/api/logout',{method:'POST',credentials:'same-origin'}); location.reload(); };
  }

  (async function(){
    try{
      var r=await fetch('/api/session',{credentials:'same-origin',cache:'no-store'});
      var j=await r.json();
      if(j.admin) renderDashboard(); else renderLogin();
    }catch(e){ renderLogin(); }
  })();
})();