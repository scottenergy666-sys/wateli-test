window.WATELI = window.WATELI || {};
window.WATELI.utils = {
  getStoredLang() {
    return localStorage.getItem('wateli-lang') || 'en';
  },
  setStoredLang(lang) {
    localStorage.setItem('wateli-lang', lang);
  },
  onReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
      fn();
    }
  },
  shouldForceScrollTop() {
    if (window.location.hash) return false;
    const navEntry = window.performance?.getEntriesByType?.('navigation')?.[0];
    return navEntry?.type !== 'back_forward';
  },
  forceScrollTopOnFreshLoad() {
    if (!this.shouldForceScrollTop()) return;
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }

    const scrollTop = () => {
      if (window.location.hash) return;
      window.scrollTo(0, 0);
    };

    window.addEventListener('pageshow', () => {
      requestAnimationFrame(scrollTop);
    }, { once: true });

    window.addEventListener('load', () => {
      requestAnimationFrame(() => setTimeout(scrollTop, 0));
    }, { once: true });
  }
};

window.WATELI.utils.forceScrollTopOnFreshLoad();
