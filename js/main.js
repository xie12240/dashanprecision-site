document.addEventListener('DOMContentLoaded',function(){
  var t=document.querySelector('.nav-toggle');
  var m=document.querySelector('header nav ul');
  if(t&&m){t.addEventListener('click',function(){m.classList.toggle('open');});}
  var form=document.getElementById('rfq');
  if(form){
    var fb=document.getElementById('form-fb');
    form.addEventListener('submit',function(e){
      e.preventDefault();
      var data=new FormData(form);
      fb.style.display='block';fb.style.color='#1a7f37';fb.textContent='Sending your inquiry...';
      fetch(form.action,{method:'POST',body:data,headers:{'Accept':'application/json'}})
        .then(function(r){return r.json().then(function(j){return {ok:r.ok,j:j};});})
        .then(function(res){
          if(res.ok){
            fb.style.color='#1a7f37';
            fb.textContent='✓ Inquiry sent! We usually reply within 24 hours on working days. (If you did not attach a drawing, you can also send it via WhatsApp +86 181 2293 6992.)';
            form.reset();
          }else{
            fb.style.color='#b3261e';
            fb.textContent='Submission failed — opening your email app instead. Please press send there.';
            openMailFallback(form);
          }
        })
        .catch(function(){fb.style.color='#b3261e';fb.textContent='Network error — opening your email app instead. Please press send there.';openMailFallback(form);});
    });
  }
  function openMailFallback(form){
    function g(n){var el=form.querySelector('[name="'+n+'"]');return el?el.value.trim():'';}
    var body='Hello Dashan Precision team,%0D%0A%0D%0ARequest a quote:%0D%0A'
      +'Name: '+encodeURIComponent(g('name')||'-')+'%0D%0A'
      +'Company: '+encodeURIComponent(g('company')||'-')+'%0D%0A'
      +'Email: '+encodeURIComponent(g('email')||'-')+'%0D%0A'
      +'WhatsApp/Phone: '+encodeURIComponent(g('whatsapp')||'-')+'%0D%0A'
      +'Interest: '+encodeURIComponent(g('interest')||'-')+'%0D%0A'
      +'Message: '+encodeURIComponent(g('message')||'-');
    var subj=encodeURIComponent('RFQ - '+((g('interest'))||'Inquiry'));
    window.location.href='mailto:xie12240@gmail.com?subject='+subj+'&body='+body;
  }
});
