document.addEventListener('DOMContentLoaded',function(){
  // mobile nav
  var t=document.querySelector('.nav-toggle');
  var m=document.querySelector('header nav ul');
  if(t&&m){t.addEventListener('click',function(){m.classList.toggle('open');});}
  // build mailto on submit
  var form=document.getElementById('rfq');
  if(form){
    form.addEventListener('submit',function(e){
      e.preventDefault();
      var g=function(id){var el=document.getElementById(id);return el?el.value.trim():'';};
      var name=g('name'),company=g('company'),country=g('country'),email=g('email'),wa=g('whatsapp');
      var interest=g('interest'),qty=g('qty'),msg=g('msg');
      var body='Hello Dashan Precision team,%0D%0A%0D%0A';
      body+='I would like to request a quote.%0D%0A%0D%0A';
      body+='Name: '+encodeURIComponent(name||'-')+'%0D%0A';
      body+='Company: '+encodeURIComponent(company||'-')+'%0D%0A';
      body+='Country: '+encodeURIComponent(country||'-')+'%0D%0A';
      body+='Email: '+encodeURIComponent(email||'-')+'%0D%0A';
      body+='WhatsApp/Phone: '+encodeURIComponent(wa||'-')+'%0D%0A';
      body+='Interest: '+encodeURIComponent(interest||'-')+'%0D%0A';
      body+='Estimated quantity: '+encodeURIComponent(qty||'-')+'%0D%0A';
      body+='%0D%0AProject details:%0D%0A'+encodeURIComponent(msg||'-');
      var subject=encodeURIComponent('RFQ - '+(interest||'Inquiry')+' from '+(company||name||'Buyer'));
      var mail='mailto:xie12240@gmail.com?subject='+subject+'&body='+body;
      window.location.href=mail;
      // feedback
      var fb=document.getElementById('form-fb');
      if(fb){fb.style.display='block';fb.textContent='✓ Your email app should open with your inquiry. Press send there. For drawings, attach them in the email or send via WhatsApp +86 181 2293 6992.';}
    });
  }
});
