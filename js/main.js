document.addEventListener('DOMContentLoaded', function () {
  var toggle = document.querySelector('.nav-toggle');
  var menu = document.querySelector('header .nav > ul');
  if (toggle && menu) {
    menu.id = 'primary-menu';
    toggle.setAttribute('aria-controls', menu.id);

    function closeMenu() {
      menu.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }

    closeMenu();
    toggle.addEventListener('click', function () {
      var open = menu.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    menu.addEventListener('click', function (event) {
      if (event.target.closest('a')) closeMenu();
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && menu.classList.contains('open')) {
        closeMenu();
        toggle.focus();
      }
    });
    document.addEventListener('click', function (event) {
      if (!menu.contains(event.target) && !toggle.contains(event.target)) {
        closeMenu();
      }
    });
  }

  var shortcut = document.querySelector('.wa-float');
  var content = document.querySelector('main');
  if (shortcut && content) {
    function keepShortcutClear() {
      if (getComputedStyle(shortcut).display === 'none') {
        shortcut.style.visibility = '';
        return;
      }
      var bounds = shortcut.getBoundingClientRect();
      function overlaps(rect) {
        return rect.width && rect.height && rect.left < bounds.right && rect.right > bounds.left
          && rect.top < bounds.bottom && rect.bottom > bounds.top;
      }
      var blocked = Array.prototype.some.call(content.querySelectorAll('a,button,input,select,textarea'), function (element) {
        return Array.prototype.some.call(element.getClientRects(), overlaps);
      });
      var walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT);
      var range = document.createRange();
      while (!blocked && walker.nextNode()) {
        var node = walker.currentNode;
        if (!node.textContent.trim() || node.parentElement.closest('script,style,[hidden]')) continue;
        range.selectNodeContents(node);
        blocked = Array.prototype.some.call(range.getClientRects(), overlaps);
      }
      shortcut.style.visibility = blocked ? 'hidden' : '';
    }
    window.addEventListener('scroll', keepShortcutClear, { passive: true });
    window.addEventListener('resize', keepShortcutClear);
    requestAnimationFrame(keepShortcutClear);
  }

  var form = document.getElementById('rfq');
  if (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (!form.reportValidity()) return;
      var data = new FormData(form);
      var body = [
        'Name: ' + data.get('name'),
        'Company: ' + (data.get('company') || ''),
        'Email: ' + data.get('email'),
        'Phone: ' + (data.get('whatsapp') || ''),
        'Interested in: ' + data.get('interest'),
        '', 'Project details:', data.get('message')
      ].join('\n');
      var draft = 'mailto:quote@dashanprecision.com?subject=Quote%20inquiry%20from%20website&body=' + encodeURIComponent(body);
      // ponytail: mailto needs an email app; keep a copyable draft for browsers without one.
      document.getElementById('draft-message').value = body;
      document.getElementById('draft-link').href = draft;
      document.getElementById('draft-status').textContent = document.documentElement.lang === 'zh'
        ? '邮件草稿已准备好。请在邮箱应用里点击发送；本页面还没有发送询盘。'
        : 'Email draft prepared. Send it from your email app; this page has not sent your inquiry.';
      document.getElementById('draft-preview').hidden = false;
      window.location.href = draft;
    });
  }
});
