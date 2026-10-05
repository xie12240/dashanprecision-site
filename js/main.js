document.addEventListener('DOMContentLoaded', function () {
  // chat.js is loaded once by the page's existing script tag.
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

  var form = document.getElementById('rfq');
  if (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (!form.reportValidity()) return;
      var data = new FormData(form);
      var lines = [
        'Name: ' + (data.get('name') || ''),
        'Company: ' + (data.get('company') || ''),
        'Email: ' + (data.get('email') || ''),
        'WhatsApp / Phone: ' + (data.get('whatsapp') || ''),
        'Interest: ' + (data.get('interest') || ''),
        '',
        String(data.get('message') || '')
      ];
      window.location.href = 'mailto:xie12240@gmail.com?subject='
        + encodeURIComponent('Quote request')
        + '&body=' + encodeURIComponent(lines.join('\n'));
    });
  }
});
