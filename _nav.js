// Navegación compartida entre wireframes.
// Detecta si la pantalla está dentro del iframe del modal de index.html
// y delega openModal/closeModal al padre. Si no, usa location/history.

(function () {
  'use strict';

  function inModal() {
    try {
      return window.parent && window.parent !== window && typeof window.parent.openModal === 'function';
    } catch (e) {
      return false;
    }
  }

  window.go = function (url, title) {
    if (!url) return;
    if (inModal()) {
      window.parent.openModal(url, title || document.title);
    } else {
      location.href = url;
    }
  };

  window.back = function (fallback) {
    if (inModal() && typeof window.parent.closeModal === 'function') {
      window.parent.closeModal();
      return;
    }
    if (history.length > 1) {
      history.back();
    } else if (fallback) {
      location.href = fallback;
    }
  };

  // Interceptar clics en <a href="..."> para que también respeten el modal.
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href');
    if (!href) return;
    if (href.startsWith('javascript:') || href.startsWith('#') || href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:')) return;
    if (a.target === '_blank') return;
    if (inModal()) {
      e.preventDefault();
      window.parent.openModal(href, a.dataset.title || document.title);
    }
  });
})();
