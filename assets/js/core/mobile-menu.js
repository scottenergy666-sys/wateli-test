(function () {
  const { onReady } = window.WATELI.utils;

  function setOpen(isOpen) {
    const mobile = document.getElementById('site-mobile');
    const openBtn = document.getElementById('mobile-menu-toggle');
    if (!mobile || !openBtn) return;
    mobile.classList.toggle('is-open', isOpen);
    mobile.setAttribute('aria-hidden', String(!isOpen));
    openBtn.setAttribute('aria-expanded', String(isOpen));
    document.body.classList.toggle('menu-open', isOpen);
  }

  function bind() {
    const openBtn = document.getElementById('mobile-menu-toggle');
    const mobile = document.getElementById('site-mobile');
    if (!openBtn || !mobile || openBtn.dataset.bound === 'true') return;
    openBtn.dataset.bound = 'true';

    openBtn.addEventListener('click', () => {
      const willOpen = !mobile.classList.contains('is-open');
      setOpen(willOpen);
    });

    mobile.querySelectorAll('[data-mobile-close], .site-mobile__nav a').forEach((el) => {
      el.addEventListener('click', () => setOpen(false));
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') setOpen(false);
    });
  }

  onReady(bind);
  document.addEventListener('wateli:layout-ready', bind);
})();
