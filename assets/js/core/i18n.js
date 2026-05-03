(function () {
  const { onReady, getStoredLang, setStoredLang } = window.WATELI.utils;
  let currentLang = null;
  let pendingLang = null;
  let cacheSignature = '';
  let textNodes = [];
  let navNodes = [];
  let headNodes = [];
  let attrNodes = [];

  function setTextIfChanged(el, value) {
    if (value == null) return;
    if (el.textContent !== value) el.textContent = value;
  }

  function setAttrIfChanged(el, attr, value) {
    if (value == null) return;
    if (el.getAttribute(attr) !== value) el.setAttribute(attr, value);
  }

  function buildCache() {
    const signature = `${document.body?.dataset.page || 'page'}:${document.querySelectorAll('[data-i18n],[data-nav],[data-i18n-head],[data-i18n-attr]').length}`;
    if (signature === cacheSignature) return;
    cacheSignature = signature;

    textNodes = Array.from(document.querySelectorAll('[data-i18n]')).map((el) => ({ el, key: el.dataset.i18n }));
    navNodes = Array.from(document.querySelectorAll('[data-nav]')).map((el) => ({ el, key: el.dataset.nav }));
    headNodes = Array.from(document.querySelectorAll('[data-i18n-head]')).map((el) => ({ el, key: el.dataset.i18nHead }));
    attrNodes = Array.from(document.querySelectorAll('[data-i18n-attr]')).map((el) => {
      const mapping = el.dataset.i18nAttr || '';
      const [attr, key] = mapping.split(':');
      return { el, attr, key };
    }).filter((item) => item.attr && item.key);
  }

  function applyNodeList(list, dict, setter) {
    for (const item of list) {
      if (Object.prototype.hasOwnProperty.call(dict, item.key)) {
        setter(item, dict[item.key]);
      }
    }
  }

  function applyLanguage(lang) {
    buildCache();
    const dict = window.WATELI_TRANSLATIONS?.[lang] || {};
    document.documentElement.lang = lang === 'zh' ? 'zh-Hant' : 'en';

    applyNodeList(textNodes, dict, ({ el }, value) => setTextIfChanged(el, value));
    applyNodeList(navNodes, dict, ({ el }, value) => setTextIfChanged(el, value));
    applyNodeList(headNodes, dict, ({ el }, value) => setTextIfChanged(el, value));
    applyNodeList(attrNodes, dict, ({ el, attr }, value) => setAttrIfChanged(el, attr, value));

    document.querySelectorAll('[data-lang-btn]').forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.langBtn === lang);
      btn.disabled = false;
    });

    document.documentElement.dataset.langSwitching = '0';
    currentLang = lang;
    pendingLang = null;
  }

  function scheduleApply(lang) {
    if (!lang || lang === pendingLang || lang === currentLang) return;
    pendingLang = lang;
    document.documentElement.dataset.langSwitching = '1';
    document.querySelectorAll('[data-lang-btn]').forEach((btn) => { btn.disabled = true; });
    const run = () => applyLanguage(lang);
    if (window.requestIdleCallback) {
      requestIdleCallback(run, { timeout: 120 });
    } else {
      setTimeout(run, 0);
    }
  }

  function bindLanguageButtons() {
    document.querySelectorAll('[data-lang-btn]').forEach((btn) => {
      if (btn.dataset.boundLang === '1') return;
      btn.dataset.boundLang = '1';
      btn.addEventListener('click', () => {
        const lang = btn.dataset.langBtn;
        if (!lang || lang === currentLang || lang === pendingLang) return;
        setStoredLang(lang);
        scheduleApply(lang);
      }, { passive: true });
    });
  }

  function init() {
    buildCache();
    bindLanguageButtons();
    const lang = getStoredLang();
    if (lang !== currentLang) {
      scheduleApply(lang);
    }
  }

  onReady(init);
  document.addEventListener('wateli:layout-ready', () => {
    cacheSignature = '';
    init();
  });
})();

document.addEventListener('DOMContentLoaded', () => {
  const heroScroll = document.querySelector('.page-hero__scroll');
  if (heroScroll) {
    heroScroll.addEventListener('click', () => {
      const next = document.querySelector('.page-hero-stats, main section:nth-of-type(2)');
      if (next) next.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, { passive: true });
  }
});
