// Navegación compartida — PeakQual wireframes
// Funciona en 2 modos:
//   1. Standalone (abriendo el .html directo): location.href / history.back
//   2. Dentro de app.html (iframe): delega al shell via window.parent

(function () {
  'use strict';

  function inShell() {
    try {
      return (
        window.parent &&
        window.parent !== window &&
        typeof window.parent.openModal === 'function'
      );
    } catch (e) {
      return false;
    }
  }

  window.go = function (url, title) {
    if (!url) return;
    if (inShell()) {
      window.parent.openModal(url, title || '');
    } else {
      location.href = url;
    }
  };

  window.back = function (fallback) {
    if (inShell()) {
      window.parent.closeModal();
      return;
    }
    if (history.length > 1) {
      history.back();
    } else if (fallback) {
      location.href = fallback;
    }
  };

  // Interceptar <a href> relativos
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href');
    if (!href) return;
    if (
      href === '#' ||
      href.startsWith('javascript:') ||
      href.startsWith('http://') ||
      href.startsWith('https://') ||
      href.startsWith('mailto:') ||
      a.target === '_blank'
    ) return;
    if (inShell()) {
      e.preventDefault();
      window.parent.openModal(href, a.dataset.title || '');
    }
  });

})();
