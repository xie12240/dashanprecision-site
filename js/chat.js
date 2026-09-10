(function () {
  'use strict';
  if (document.getElementById('ds-chat')) return;
  var zh = (function(){ try { if (new URLSearchParams(location.search).get('lang') === 'zh') return true; return localStorage.getItem('dashan_lang') === 'zh'; } catch (e) { return false; } })();
  var text = zh ? {
    open:'大山24小时客服',title:'大山精密 24小时客服',close:'关闭客服',checking:'正在连接...',online:'客服已连接',offline:'客服暂时离线',busy:'正在回复...',
    intro:'您好！您想了解模具制造、注塑加工，还是报价所需资料？',
    notice:'如需正式报价或确认交期，请通过下方「提交询盘」或「联系业务员」与我们联系。',
    placeholder:'输入您的问题...',send:'发送',label:'您的问题',retry:'重新连接',quote:'提交询盘',human:'联系业务员',
    failed:'暂时无法回复，请稍后重试，或通过下方入口联系业务员。',limit:'请将问题缩短至 2000 字以内。',
    offlineHint:'客服暂时离线。正式报价请通过下方“提交询盘”或“联系业务员”入口。',
    offlineReply:'（离线模式）客服暂不可用，请通过下方“提交询盘”或“联系业务员”入口与我们沟通。',
    samples:['报价需要什么资料？','模具交期多久？','能签保密协议吗？']
  } : {
    open:'24/7 Support',title:'DASHAN 24/7 Support',close:'Close assistant',checking:'Connecting...',online:'Connected',offline:'Currently offline',busy:'Replying...',
    intro:'Hello! How can I help with mold making, injection molding, or preparing a quote request?',
    notice:'For a formal quote or to confirm lead times, please use the Request a quote or Contact sales buttons below.',
    placeholder:'Type your question...',send:'Send',label:'Your question',retry:'Reconnect',quote:'Request a quote',human:'Contact sales',
    failed:'Sorry, we could not reply just now. Please try again later, or contact sales using the links below.',limit:'Please keep your question within 2,000 characters.',
    offlineHint:'Live chat is temporarily offline. For a real quote, use “Request a quote” or “Contact sales” below.',
    offlineReply:'(Offline mode) Live chat is currently unavailable. Please use “Request a quote” or “Contact sales” below to reach our team.',
    samples:['What do you need for a quote?','What are your mold lead times?','Can you sign an NDA?']
  };
  var style = document.createElement('link');
  style.rel = 'stylesheet'; style.href = 'css/chat.css'; document.head.appendChild(style);
  var host = document.createElement('div'); host.id = 'ds-chat';
  host.innerHTML = '<button type="button" class="ds-launch" aria-expanded="false" aria-controls="ds-panel"></button>' +
    '<section id="ds-panel" role="dialog" aria-labelledby="ds-title" hidden>' +
    '<div class="ds-head"><div><h2 id="ds-title"></h2><p id="ds-status" role="status"></p></div><button type="button" class="ds-close">&#215;</button></div>' +
    '<div class="ds-log" role="log" aria-live="polite" aria-relevant="additions" aria-label="Conversation"></div>' +
    '<div class="ds-samples"></div><p class="ds-notice"></p>' +
    '<form class="ds-form"><label class="ds-sr" for="ds-input"></label><div class="ds-compose"><textarea id="ds-input" rows="2" maxlength="2000"></textarea><button type="submit" class="ds-send"></button></div></form>' +
    '<div class="ds-actions"><button type="button" class="ds-retry"></button><a class="ds-quote" href="contact.html#rfq"></a><a class="ds-human" target="_blank" rel="noopener" href="https://wa.me/8618122936992"></a></div></section>';
  document.body.appendChild(host);
  var panel = host.querySelector('#ds-panel'), launch = host.querySelector('.ds-launch');
  var close = host.querySelector('.ds-close'), status = host.querySelector('#ds-status');
  var log = host.querySelector('.ds-log'), input = host.querySelector('#ds-input');
  var send = host.querySelector('.ds-send'), retry = host.querySelector('.ds-retry');
  var history = [], endpoint = '', busy = false, ready = false, connecting = false, offlineMode = false, offlineAnnounced = false;
  launch.textContent = text.open; close.setAttribute('aria-label',text.close); close.title=text.close;
  host.querySelector('#ds-title').textContent=text.title;
  host.querySelector('.ds-notice').textContent=text.notice;
  host.querySelector('label').textContent=text.label; input.placeholder=text.placeholder;
  send.textContent=text.send; retry.textContent=text.retry;
  host.querySelector('.ds-quote').textContent=text.quote;
  host.querySelector('.ds-human').textContent=text.human;
  log.setAttribute('aria-label',zh?'对话记录':'Conversation');
  function message(value, role) {
    var row=document.createElement('p'); row.className='ds-message ds-'+role;
    row.textContent=value; log.appendChild(row); log.scrollTop=log.scrollHeight;
  }
  function state(value) {
    status.textContent=value;
    send.disabled=busy||!ready;
    input.disabled=busy;
    retry.disabled=busy||connecting;
    host.querySelector('.ds-samples').querySelectorAll('button').forEach(function(b){b.disabled=busy||!ready;});
  }
  async function request(url, options, timeout) {
    var controller=new AbortController(), timer=setTimeout(function(){controller.abort();},timeout);
    try {
      var response=await fetch(url,Object.assign({},options,{signal:controller.signal,credentials:'omit',cache:'no-store'}));
      if(!response.ok) throw new Error('Unavailable');
      return await response.json();
    } finally {clearTimeout(timer);}
  }
  async function connect() {
    if(connecting||busy)return;
    connecting=true;ready=false;offlineMode=false;state(text.checking);
    try {
      var config=await request('chat-config.json',{},8000);
      if(!config||typeof config!=='object')throw new Error('Bad config');
      // 沙箱规则：空 endpoint 或显式 mock 标记时，一律走本地离线占位，绝不发起网络请求。
      if(config.mock===true||!config.endpoint)throw new Error('Local stub mode');
      var url=new URL(config.endpoint);
      if(url.protocol!=='https:')throw new Error('Invalid endpoint');
      endpoint=url.origin;
      var health=await request(endpoint+'/health',{},10000);
      if(health.ok!==true)throw new Error('Unhealthy');
      ready=true;
    } catch(e) {
      // 配置缺失 / 不可达 / 校验失败 → 离线演示模式（本地 stub，无任何网络写入）
      endpoint='';ready=true;offlineMode=true;
    }
    connecting=false;
    if(offlineMode)enterOffline();else state(text.online);
  }
  function enterOffline() {
    host.classList.add('ds-offline');
    state(text.offline);
    if(!offlineAnnounced){offlineAnnounced=true;message(text.offlineHint,'assistant');}
  }
  // 本地 stub：不请求任何服务器，直接返回离线占位回复
  function offlineReply(value){
    busy=true;state(text.busy);
    setTimeout(function(){
      message(text.offlineReply,'assistant');
      history.push({role:'user',content:value},{role:'assistant',content:text.offlineReply});
      history=history.slice(-6);
      busy=false;state(text.offline);
      if(!panel.hidden){try{input.focus();}catch(e){}}
    },400);
  }
  function show(open) {
    open=!!open;
    panel.hidden=!open; launch.setAttribute('aria-expanded',String(open));
    document.body.classList.toggle('ds-chat-open',open);
    try{
      if(open){input.focus();if(!busy&&!connecting)connect();}else{launch.focus();}
    }catch(e){/* 焦点失败不阻断开关 */}
  }
  launch.addEventListener('click',function(){show(panel.hidden);});
  close.addEventListener('click',function(){show(false);});
  host.addEventListener('keydown',function(e){if(e.key==='Escape'){show(false);e.stopPropagation();}});
  retry.addEventListener('click',connect);
  input.addEventListener('keydown',function(e){
    if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();host.querySelector('form').requestSubmit();}
  });
  message(text.intro,'assistant');
  text.samples.forEach(function(value){
    var b=document.createElement('button');b.type='button';b.textContent=value;
    b.addEventListener('click',function(){input.value=value;input.focus();});
    host.querySelector('.ds-samples').appendChild(b);
  });
  state(text.offline);
  host.querySelector('form').addEventListener('submit',async function(e){
    e.preventDefault();
    var value=input.value.trim();
    if(!value||busy||!ready)return;
    if(value.length>2000){message(text.limit,'error');return;}
    busy=true;state(text.busy);message(value,'user');input.value='';
    if(offlineMode){offlineReply(value);return;}
    host.querySelector('.ds-human').href='https://wa.me/8618122936992?text='+encodeURIComponent('Hello DASHAN, '+value.slice(0,500));
    try {
      var result=await request(endpoint+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:value,history:history.slice(-6)})},55000);
      if(typeof result.reply!=='string'||!result.reply.trim())throw new Error('Empty reply');
      var reply=result.reply.slice(0,6000);
      message(reply,'assistant');history.push({role:'user',content:value},{role:'assistant',content:reply});
      history=history.slice(-6);
      while(history.reduce(function(sum,m){return sum+m.content.length;},0)>9000)history.splice(0,2);
    } catch(err) {
      // 请求失败 → 回落到本地离线演示，而不是永久禁用发送
      message(text.failed,'error');input.value=value;
      endpoint='';offlineMode=true;enterOffline();
    }
    finally {busy=false;if(offlineMode)enterOffline();else state(text.online);if(!panel.hidden){try{input.focus();}catch(e){}}}
  });
})();
