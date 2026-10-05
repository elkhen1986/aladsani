/* منصة العدساني - مربع حوار موحد بدل رسائل النظام */
(function(){
  window.PlatformDialog = {
    confirm: function(opts){
      opts = opts || {};
      var title = opts.title || 'تأكيد';
      var message = opts.message || 'هل أنت متأكد؟';
      var confirmText = opts.confirmText || 'تأكيد';
      var cancelText = opts.cancelText || 'إلغاء';
      var danger = !!opts.danger;
      
      return new Promise(function(resolve){
        var modal = document.createElement('div');
        modal.className = 'modal open';
        modal.innerHTML = '<div class="m-box" role="dialog" aria-modal="true" style="max-width:420px;text-align:center"><div style="width:56px;height:56px;border-radius:50%;margin:0 auto 14px;display:grid;place-items:center;font-size:26px;'+(danger?'background:#fdecec;color:#c62f2f':'background:#eef2f9;color:var(--navy)')+'">'+(danger?'⚠️':'؟')+'</div><h3 style="font-size:18px;font-weight:900;color:var(--navy)">'+title+'</h3><p style="margin-top:8px;color:var(--muted);font-size:14px;line-height:1.7">'+message+'</p><div class="m-act" style="margin-top:20px;justify-content:center"><button type="button" class="btn '+(danger?'btn-danger':'btn-navy')+'" id="dlgConfirm">'+confirmText+'</button><button type="button" class="btn btn-ghost" id="dlgCancel">'+cancelText+'</button></div></div>';
        document.body.appendChild(modal);
        
        function close(val){
          modal.classList.remove('open');
          setTimeout(function(){ modal.remove(); }, 200);
          resolve(val);
        }
        
        modal.querySelector('#dlgConfirm').onclick = function(){ close(true); };
        modal.querySelector('#dlgCancel').onclick = function(){ close(false); };
        modal.onclick = function(e){ if(e.target===modal) close(false); };
        document.addEventListener('keydown', function esc(e){
          if(e.key==='Escape'){ close(false); document.removeEventListener('keydown', esc); }
        });
        modal.querySelector('#dlgConfirm').focus();
      });
    },
    
    alert: function(title, message){
      return new Promise(function(resolve){
        var modal = document.createElement('div');
        modal.className = 'modal open';
        modal.innerHTML = '<div class="m-box" role="dialog" aria-modal="true" style="max-width:400px;text-align:center"><h3 style="font-size:18px;font-weight:900;color:var(--navy)">'+(title||'تنبيه')+'</h3><p style="margin-top:8px;color:var(--muted);font-size:14px;line-height:1.7">'+(message||'')+'</p><div class="m-act" style="margin-top:18px;justify-content:center"><button class="btn btn-navy" id="dlgOk">حسناً</button></div></div>';
        document.body.appendChild(modal);
        function close(){ modal.classList.remove('open'); setTimeout(function(){ modal.remove(); },200); resolve(); }
        modal.querySelector('#dlgOk').onclick = close;
        modal.onclick = function(e){ if(e.target===modal) close(); };
        modal.querySelector('#dlgOk').focus();
      });
    }
  };
})();