/* DASHAN Precision - 多语言切换 (i18n)
   词典文件: js/lang/<code>.js 定义 window.I18N_DICTS[code] = { 英文原文: 译文 }
   用法: 页面在 </body> 前引入 <script src="js/lang/zh.js"></script><script src="js/i18n.js"></script>
   默认英文; 选择记住在 localStorage; 中文浏览器首次访问显示可关闭的提示条。
*/
(function () {
  var KEY = 'dashan_lang';
  var SUPPORTED = ['en', 'zh'];
  var LABELS = { en: 'English', zh: '简体中文' };
  var NATIVE = { en: 'English', zh: '中文' };
  var FLAGS = { en: '🇺🇸', zh: '🇨🇳' };

  function current() {
    // 支持 ?lang=xx 覆盖（对测试与分享指定语言链接有用）
    var q = new URLSearchParams(location.search).get('lang');
    if (q && SUPPORTED.indexOf(q) > -1) return q;
    var v = null;
    try { v = localStorage.getItem(KEY); } catch (e) {}
    if (v && SUPPORTED.indexOf(v) > -1) return v;
    return 'en';
  }
  function save(l) {
    try { localStorage.setItem(KEY, l); } catch (e) {}
  }
  function selectLanguage(lang) {
    save(lang);
    var url = new URL(location.href);
    url.searchParams.set('lang', lang);
    location.assign(url.href);
  }
  function dict(lang) {
    var d = window.I18N_DICTS || {};
    return d[lang] || {};
  }
  function apply(lang) {
    if (lang === 'en') return; // English is source; nothing to replace
    var d = dict(lang);
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (n) {
      if (n.parentElement && n.parentElement.closest('script,style,.lang-w,#lang-banner')) return;
      var raw = n.nodeValue;
      if (!raw) return;
      // 归一化空白再匹配（源码换行/缩进不影响）
      var norm = raw.replace(/\s+/g, ' ').trim();
      if (!norm) return;
      if (d.hasOwnProperty(norm) && d[norm]) {
        // 保留原节点首尾空白，避免破坏排版
        var lead = raw.match(/^\s*/)[0];
        var tail = raw.match(/\s*$/)[0];
        n.nodeValue = lead + d[norm] + tail;
      }
    });
    document.querySelectorAll('[placeholder],[aria-label]').forEach(function (el) {
      ['placeholder', 'aria-label'].forEach(function (attr) {
        var value = el.getAttribute(attr);
        if (value && Object.prototype.hasOwnProperty.call(d, value)) el.setAttribute(attr, d[value]);
      });
    });
    if (document.documentElement) document.documentElement.lang = lang;
  }

  function buildSwitcher() {
    var holder = document.querySelector('.nav-cta');
    if (!holder || document.getElementById('lang-w')) return;
    var wrap = document.createElement('div');
    wrap.id = 'lang-w';
    wrap.className = 'lang-w';
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'lang-btn';
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', 'language-options');
    btn.setAttribute('aria-label', 'Choose language');
    btn.innerHTML = '🌐 <span class="lang-cur">' + (NATIVE[current()] || 'English') + '</span> <span class="caret">▾</span>';
    var menu = document.createElement('ul');
    menu.className = 'lang-menu';
    menu.id = 'language-options';
    SUPPORTED.forEach(function (code) {
      var li = document.createElement('li');
      var a = document.createElement('a');
      var target = new URL(location.href);
      target.searchParams.set('lang', code);
      a.href = target.href;
      a.setAttribute('data-lang', code);
      a.textContent = FLAGS[code] + ' ' + LABELS[code];
      if (code === current()) a.className = 'active';
      li.appendChild(a);
      menu.appendChild(li);
    });
    wrap.appendChild(btn);
    wrap.appendChild(menu);
    holder.insertBefore(wrap, holder.firstChild);
    function close() { wrap.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); }
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      btn.setAttribute('aria-expanded', String(wrap.classList.toggle('open')));
    });
    menu.addEventListener('click', function (e) {
      var a = e.target.closest ? e.target.closest('a[data-lang]') : null;
      if (!a) return;
      e.preventDefault();
      e.stopPropagation();
      var code = a.getAttribute('data-lang');
      if (code === current()) { close(); return; }
      selectLanguage(code);
    });
    document.addEventListener('click', close);
    wrap.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { close(); btn.focus(); }
    });
    wrap.addEventListener('focusout', function (e) { if (!wrap.contains(e.relatedTarget)) close(); });
  }

  function langBanner() {
    if (current() !== 'en') return;
    var b;
    try { b = localStorage.getItem('dashan_lang_banner'); } catch (e) {}
    if (b === '1') return;
    var nav = navigator.language || '';
    if (nav.toLowerCase().indexOf('zh') !== 0) return;
    var bar = document.createElement('div');
    bar.id = 'lang-banner';
    bar.innerHTML = '🌐 本页可切换为简体中文 — <a href="#" data-go="zh">切换</a> · <a href="#" data-close="1">忽略</a>';
    document.body.insertBefore(bar, document.body.firstChild);
    bar.addEventListener('click', function (e) {
      var go = e.target.getAttribute && e.target.getAttribute('data-go');
      var close = e.target.getAttribute && e.target.getAttribute('data-close');
      if (go) { e.preventDefault(); selectLanguage(go); }
      if (close) { try { localStorage.setItem('dashan_lang_banner', '1'); } catch (err) {} bar.remove(); }
    });
  }

  function init() {
    save(current());
    buildSwitcher();
    langBanner();
    apply(current());
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();


