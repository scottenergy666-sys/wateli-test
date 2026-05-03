(function () {
  const { onReady, getStoredLang } = window.WATELI.utils;
  const t = (key) => (window.WATELI_TRANSLATIONS?.[getStoredLang()]?.[key] || key);
  let renderedSignature = '';
  let lastHeaderHTML = '';
  let lastFooterHTML = '';

  function navLinks(page) {
    const isActive = (name) => page === name ? 'is-active' : '';
    return `
      <a href="index.html" class="${isActive('home')}" data-nav="nav_home">${t('nav_home')}</a>
      <a href="products.html" class="${isActive('products')}" data-nav="nav_products">${t('nav_products')}</a>
      <a href="dealer.html" class="${isActive('dealer')}" data-nav="nav_dealer">${t('nav_dealer')}</a>
      <a href="where-to-buy.html" class="${isActive('resources')}" data-nav="nav_resources">${t('nav_resources')}</a>
      <a href="contact.html" class="${isActive('contact')}" data-nav="nav_contact">${t('nav_contact')}</a>`;
  }

  function buildHeader() {
    const page = document.body.dataset.page || 'home';
    return `
      <header class="site-header">
        <div class="container site-header__inner">
          <a href="index.html" class="brand site-logo" aria-label="WATELI Home">
            <span class="brand-mark"><span>W</span></span>
            <span>WATELI</span>
          </a>

          <nav class="site-nav site-nav--desktop" aria-label="Primary Navigation">
            ${navLinks(page)}
          </nav>

          <div class="site-header__actions">
            <div class="lang-switch lang-switch--header" aria-label="Language Switch">
              <button type="button" data-lang-btn="zh">中</button>
              <button type="button" data-lang-btn="en">EN</button>
            </div>
            <button class="icon-btn menu-toggle" type="button" id="mobile-menu-toggle" aria-label="Open Menu" aria-controls="site-mobile" aria-expanded="false">☰</button>
          </div>
        </div>
      </header>
      <div class="site-mobile" id="site-mobile" aria-hidden="true">
        <div class="site-mobile__backdrop" data-mobile-close></div>
        <div class="site-mobile__panel" role="dialog" aria-modal="true" aria-label="Mobile Navigation">
          <div class="site-mobile__top">
            <strong data-nav="mobile_title">${t('mobile_title')}</strong>
            <button class="icon-btn" type="button" data-mobile-close aria-label="Close Menu">✕</button>
          </div>
          <nav class="site-mobile__nav">${navLinks(page)}</nav>
        </div>
      </div>`;
  }

  function footerLinks(page) {
    const isActive = (name) => page === name ? 'is-active' : '';
    return `
      <a href="index.html" class="${isActive('home')}" data-nav="nav_home">${t('nav_home')}</a>
      <a href="products.html" class="${isActive('products')}" data-nav="nav_products">${t('nav_products')}</a>
      <a href="dealer.html" class="${isActive('dealer')}" data-nav="nav_dealer">${t('nav_dealer')}</a>
      <a href="where-to-buy.html" class="${isActive('resources')}" data-nav="nav_resources">${t('nav_resources')}</a>
      <a href="contact.html" class="${isActive('contact')}" data-nav="nav_contact">${t('nav_contact')}</a>`;
  }

  function buildFooter() {
    const page = document.body.dataset.page || 'home';
    return `
      <footer class="site-footer">
        <div class="container">
          <div class="site-footer__panel">
            <div class="site-footer__brand">
              <a href="index.html" class="brand site-footer__logo" aria-label="WATELI Home">
                <span class="brand-mark"><span>W</span></span>
                <span>WATELI</span>
              </a>
              <p class="site-footer__desc" data-nav="footer_desc">${t('footer_desc')}</p>
              <div class="site-footer__tag" data-nav="footer_tagline">${t('footer_tagline')}</div>
            </div>

            <div class="site-footer__nav-block">
              <h3 data-nav="footer_nav_title">${t('footer_nav_title')}</h3>
              <nav class="site-footer__nav" aria-label="Footer Navigation">${footerLinks(page)}</nav>
            </div>

            <div class="site-footer__contact">
              <h3 data-nav="footer_contact_title">${t('footer_contact_title')}</h3>
              <p data-nav="footer_contact_desc">${t('footer_contact_desc')}</p>
              <a href="contact.html" class="btn btn-secondary site-footer__btn" data-nav="footer_contact_btn">${t('footer_contact_btn')}</a>
            </div>
          </div>

          <div class="site-footer__bottom">
            <div class="site-footer__line"></div>
            <div class="site-footer__copyright" data-nav="footer_text">${t('footer_text')}</div>
          </div>
        </div>
      </footer>`;
  }

  function renderLayout() {
    const page = document.body.dataset.page || 'home';
    const signature = `${page}:${getStoredLang()}`;
    if (signature === renderedSignature) {
      document.dispatchEvent(new CustomEvent('wateli:layout-ready'));
      return;
    }

    const headerRoot = document.getElementById('site-header');
    const footerRoot = document.getElementById('site-footer');
    const headerHTML = buildHeader();
    const footerHTML = buildFooter();
    if (headerRoot && headerHTML !== lastHeaderHTML) {
      headerRoot.innerHTML = headerHTML;
      lastHeaderHTML = headerHTML;
    }
    if (footerRoot && footerHTML !== lastFooterHTML) {
      footerRoot.innerHTML = footerHTML;
      lastFooterHTML = footerHTML;
    }
    renderedSignature = signature;
    requestAnimationFrame(() => document.dispatchEvent(new CustomEvent('wateli:layout-ready')));
  }

  onReady(renderLayout);
})();
