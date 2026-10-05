(function () {
  'use strict';
  if (document.getElementById('ds-chat')) return;
  var zh = (function(){ try { if (new URLSearchParams(location.search).get('lang') === 'zh') return true; return localStorage.getItem('dashan_lang') === 'zh'; } catch (e) { return false; } })();
  var text = zh ? {
    open:'询盘助手',title:'大山精密询盘助手',close:'关闭助手',checking:'正在连接...',online:'助手已连接',offline:'助手暂时离线',busy:'正在回复...',
    intro:'您好！您想了解模具制造、注塑加工，还是报价所需资料？',
    notice:'报价和交期请通过下方入口与车间直接确认。先简单描述项目即可，图纸和保密协议可在沟通后提供。',
    placeholder:'输入您的问题...',send:'发送',label:'您的问题',retry:'重新连接',quote:'获取免费报价',human:'WhatsApp 联系工厂 — 通常 24 小时内回复',
    failed:'暂时无法回复，请稍后重试，或通过下方入口联系业务员。',limit:'请将问题缩短至 2000 字以内。',
    offlineHint:'助手暂时离线。请通过下方“获取免费报价”或 WhatsApp 入口直接联系车间。',
    offlineReply:'助手暂不可用。您的消息尚未发送给车间，请通过下方“获取免费报价”或 WhatsApp 入口与我们沟通。',
    samples:['报价需要什么资料？','模具交期多久？','能签保密协议吗？']
  } : {
    open:'Ask the workshop',title:'DASHAN inquiry assistant',close:'Close assistant',checking:'Connecting...',online:'Connected',offline:'Currently offline',busy:'Replying...',
    intro:'Hello! How can I help with mold making, injection molding, or preparing a quote request?',
    notice:'For a quote or confirmed lead times, use the direct contact links below. A short project description is enough to start; drawings and an NDA can follow.',
    placeholder:'Type your question...',send:'Send',label:'Your question',retry:'Reconnect',quote:'Get a free quote',human:'WhatsApp the factory — usually reply in 24h',
    failed:'Sorry, we could not reply just now. Please try again later, or contact sales using the links below.',limit:'Please keep your question within 2,000 characters.',
    offlineHint:'The assistant is temporarily offline. Use “Get a free quote” or WhatsApp below to reach the workshop.',
    offlineReply:'The assistant is currently unavailable. Use “Get a free quote” or WhatsApp below to reach our team. Your message has not been sent to the team.',
    samples:['What do you need for a quote?','What are your mold lead times?','Can you sign an NDA?']
  };
  var style = document.createElement('link');
  style.rel = 'stylesheet'; style.href = 'css/chat.css?v=20261006-2'; document.head.appendChild(style);
  var host = document.createElement('div'); host.id = 'ds-chat';
  host.innerHTML = '<button type="button" class="ds-launch" aria-expanded="false" aria-controls="ds-panel"></button>' +
    '<section id="ds-panel" role="dialog" aria-labelledby="ds-title" hidden>' +
    '<div class="ds-head"><div><h2 id="ds-title"></h2><p id="ds-status" role="status"></p></div><button type="button" class="ds-close">&#215;</button></div>' +
    '<div class="ds-log" role="log" aria-live="polite" aria-relevant="additions" aria-label="Conversation"></div>' +
    '<div class="ds-samples"></div><p class="ds-notice"></p>' +
    '<form class="ds-form"><label class="ds-sr" for="ds-input"></label><div class="ds-compose"><textarea id="ds-input" rows="2" maxlength="2000"></textarea><button type="submit" class="ds-send"></button></div></form>' +
    '<div class="ds-actions"><button type="button" class="ds-retry"></button><a class="ds-quote" href="contact.html"></a><a class="ds-human" target="_blank" rel="noopener" href="https://wa.me/8618122936992?text=Hello%20DASHAN%2C%20I%20would%20like%20to%20discuss%20a%20project."></a></div></section>';
  document.body.appendChild(host);
  var panel = host.querySelector('#ds-panel'), launch = host.querySelector('.ds-launch');
  var close = host.querySelector('.ds-close'), status = host.querySelector('#ds-status');
  var log = host.querySelector('.ds-log'), input = host.querySelector('#ds-input');
  var send = host.querySelector('.ds-send'), retry = host.querySelector('.ds-retry');
  var history = [], endpoint = '', busy = false, ready = false, connecting = false, offlineMode = false, offlineAnnounced = false;
  // 领域知识引导：随每次请求带给 DeepSeek，补齐旧提示词缺失的交期/报价/诚实守则等关键事实。
  var PRIME = [
    { role: 'user', content: 'Remind me of DASHAN Precision\'s key facts for answering buyers.' },
    { role: 'assistant', content: 'DASHAN Precision is a mold-making and injection-molding workshop in Dongguan, China. Start with a short project description; do not demand drawings in the first reply. After the conversation starts, offer to discuss drawings and an NDA if needed. Prices and lead times require team confirmation. The team usually replies within 24 hours on working days; this is not a guarantee. Always reply in the customer\'s language including Chinese. Never invent jobs, customers, ISO certification or specific precision claims. Direct contact: Xie Wendong · Owner, WhatsApp +86 181 2293 6992, xie12240@gmail.com.' }
  ];
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
    host.querySelector('.ds-human').href='https://wa.me/8618122936992?text='+encodeURIComponent('Hello DASHAN, '+value.slice(0,500));
    if(offlineMode){offlineReply(value);return;}
    try {
      var result=await request(endpoint+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:value,history:PRIME.concat(history.slice(-6))})},55000);
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
