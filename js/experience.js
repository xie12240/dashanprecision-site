/* Progressive enhancement: content remains readable without animation. */
document.addEventListener('DOMContentLoaded', function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  if ('IntersectionObserver' in window && !reduced.matches) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('arrived');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.06 });
    document.querySelectorAll('.sec-head,.about-grid,.why-grid,.card,.g-item,.ind,.step,.process-card,.equipment-card,.application-card').forEach(function (el) {
      el.classList.add('reveal');
      observer.observe(el);
    });
    reduced.addEventListener('change', function (event) {
      if (event.matches) {
        document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('arrived'); });
        observer.disconnect();
      }
    });
  }
  var gallery = document.querySelectorAll('.g-item');
  if (!gallery.length || !window.HTMLDialogElement) return;
  var dialog = document.createElement('dialog');
  dialog.className = 'photo-dialog';
  var close = document.createElement('button');
  close.type = 'button';
  close.textContent = '×';
  close.setAttribute('aria-label', document.documentElement.lang === 'zh' ? '关闭图片' : 'Close photo');
  var photo = document.createElement('img');
  var caption = document.createElement('p');
  caption.id = 'photo-caption';
  dialog.setAttribute('aria-labelledby', caption.id);
  dialog.append(close, photo, caption);
  document.body.appendChild(dialog);
  close.addEventListener('click', function () { dialog.close(); });
  dialog.addEventListener('click', function (event) { if (event.target === dialog) dialog.close(); });
  gallery.forEach(function (item) {
    if (item.querySelector('a,button')) return;
    var img = item.querySelector('img');
    if (!img) return;
    var button = document.createElement('button');
    button.className = 'photo-open';
    button.type = 'button';
    button.setAttribute('aria-label', (document.documentElement.lang === 'zh' ? '放大图片：' : 'Enlarge photo: ') + (item.textContent.trim() || img.alt));
    button.addEventListener('click', function () {
      photo.src = img.currentSrc || img.src;
      photo.alt = img.alt;
      caption.textContent = item.querySelector('.g-cap') ? item.querySelector('.g-cap').textContent : img.alt;
      dialog.showModal();
    });
    item.appendChild(button);
  });
});
