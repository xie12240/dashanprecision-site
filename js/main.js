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

  // Keep FormSubmit's native multipart attachment upload and Remove control.
  var attachment = document.getElementById('attachment');
  var clearFile = document.getElementById('clear-file');
  if (attachment && clearFile) {
    function updateAttachment() {
      var file = attachment.files && attachment.files[0];
      clearFile.style.display = file ? 'inline-block' : 'none';
      attachment.setCustomValidity(file && file.size > 10 * 1024 * 1024
        ? (document.documentElement.lang === 'zh'
          ? '文件超过 10 MB，请缩小文件或通过邮件发送。'
          : 'This file exceeds 10 MB. Please use a smaller file or email it to us.')
        : '');
    }

    attachment.addEventListener('change', updateAttachment);
    clearFile.addEventListener('click', function () {
      attachment.value = '';
      updateAttachment();
      attachment.focus();
    });
    updateAttachment();
  }

  var form = document.getElementById('rfq');
  if (form) {
    var button = form.querySelector('button[type="submit"]');
    var idleLabel;
    var submitting = false;
    var restoreTimer;
    var leadTimeoutMs = 8000;

    function restore() {
      window.clearTimeout(restoreTimer);
      submitting = false;
      if (button) {
        button.disabled = false;
        if (idleLabel) button.textContent = idleLabel;
      }
      form.removeAttribute('aria-busy');
    }

    window.addEventListener('pageshow', restore);
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (submitting || !form.reportValidity()) return;

      submitting = true;
      if (button) {
        idleLabel = button.textContent;
        button.disabled = true;
        button.textContent = document.documentElement.lang === 'zh'
          ? '正在发送...'
          : 'Sending...';
      }
      form.setAttribute('aria-busy', 'true');
      restoreTimer = window.setTimeout(restore, 20000);

      // Collect the existing Cloudflare lead, then submit to the unchanged
      // FormSubmit action. A stalled lead request must not block the inquiry.
      var controller = typeof AbortController !== 'undefined'
        ? new AbortController()
        : null;
      var leadTimer;
      var nativeSubmitted = false;

      function submitNative() {
        if (nativeSubmitted) return;
        nativeSubmitted = true;
        window.clearTimeout(leadTimer);
        form.submit();
      }

      leadTimer = window.setTimeout(function () {
        if (controller) controller.abort();
        submitNative();
      }, leadTimeoutMs);

      try {
        var data = new FormData(form);
        data.set('page', location.href);
        data.set('lang', document.documentElement.lang || 'en');
        var options = { method: 'POST', body: data };
        if (controller) options.signal = controller.signal;
        fetch('https://dashan-chat.313321824.workers.dev/api/leads', options)
          .then(submitNative, submitNative);
      } catch (error) {
        submitNative();
      }
    });
  }
});
