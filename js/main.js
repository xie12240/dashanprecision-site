document.addEventListener('DOMContentLoaded',function(){
  var t=document.querySelector('.nav-toggle');
  var m=document.querySelector('header nav ul');
  if(t&&m){t.addEventListener('click',function(){m.classList.toggle('open');});}

  // 已选文件 → 显示"移除"按钮；点击可删除（FormSubmit 原生 multipart 上传）
  var att=document.getElementById('attachment');
  var clr=document.getElementById('clear-file');
  if(att&&clr){
    function upd(){clr.style.display=att.files&&att.files.length>0?'inline-block':'none';}
    att.addEventListener('change',upd);
    clr.addEventListener('click',function(){att.value='';upd();});
    upd();
  }

  // 询盘表单：不做 AJAX 拦截，交给浏览器以 multipart 原生提交到 FormSubmit，
  // 文件会作为邮件附件发送；提交后跳转到站内感谢页。
  var form=document.getElementById('rfq');
  if(form){
    form.addEventListener('submit',function(){
      var btn=form.querySelector('button[type="submit"]');
      if(btn){btn.disabled=true;btn.textContent='Sending...';}
    });
  }
});
