document.addEventListener('DOMContentLoaded', () => {
  const path = (window.location.pathname || '').toLowerCase();
  const explicitSeriesKey = (document.body?.dataset?.series || document.documentElement?.dataset?.series || '').toLowerCase().trim();
  const pageMatch = path.match(/products-(block|slim|split|stick|twin)(?:-preview)?\.html$/) ||
    ((window.location.href || '').toLowerCase().match(/products-(block|slim|split|stick|twin)(?:-preview)?\.html/));
  const seriesKey = explicitSeriesKey || (pageMatch ? pageMatch[1] : '');
  if (!seriesKey) return;
  const seriesLabelMap = {
    block: 'BLOCK',
    slim: 'SLIM',
    split: 'SPLIT',
    stick: 'STICK',
    twin: 'TWIN'
  };
  const seriesLabel = seriesLabelMap[seriesKey] || 'SERIES';

  // CLEAN BASE: overlay / modal control classes disabled

  const IMAGE_EXTENSIONS = ['jpg', 'png', 'webp'];

  const normalizeSkuFolder = (value) => String(value || '').trim();

  const normalizeSegment = (value) => String(value || '').trim().replace(/^\/+|\/+$/g, '');

  const buildImageBasePath = (sku) => {
    const skuFolder = normalizeSkuFolder(sku);
    if (!skuFolder || !seriesKey) return '';
    return ['assets/images/products', normalizeSegment(seriesKey), skuFolder].join('/');
  };

  const buildExtensionCandidates = (basePath, fileName) => {
    const normalizedBase = String(basePath || '').replace(/\/+$/g, '');
    const normalizedName = String(fileName || '').replace(/^\/+|\/+$/g, '');
    const target = normalizedName ? (normalizedBase + '/' + normalizedName) : normalizedBase;
    return IMAGE_EXTENSIONS.map((ext) => `${target}.${ext}`);
  };

  const resolveFirstExistingImage = (candidates) => new Promise((resolve) => {
    const list = Array.isArray(candidates) ? candidates.filter(Boolean) : [];
    const next = (index) => {
      if (index >= list.length) {
        resolve('');
        return;
      }
      const probe = new Image();
      probe.onload = () => resolve(list[index]);
      probe.onerror = () => next(index + 1);
      probe.src = list[index];
    };
    next(0);
  });

  const buildProductModel = (sku) => {
    const basePath = buildImageBasePath(sku);
    const model = {
      hero: '',
      skuImages: [],
      series: seriesKey,
      sku: normalizeSkuFolder(sku)
    };

    if (!basePath) return Promise.resolve(model);

    return resolveFirstExistingImage(buildExtensionCandidates(basePath, 'hero')).then((heroSrc) => {
      model.hero = heroSrc || '';
      const pending = [];
      for (let i = 1; i <= 12; i += 1) {
        pending.push(resolveFirstExistingImage(buildExtensionCandidates(basePath, `sku-${i}`)).then((src) => src || ''));
      }
      return Promise.all(pending).then((results) => {
        model.skuImages = results.filter(Boolean);
        return model;
      });
    });
  };

  const getVoltageGroupFromCard = (card) => {
    const voltage = String(card?.dataset?.voltage || '').trim();
    if (voltage === '7.4') return '7.4V';
    if (voltage === '11.1') return '11.1V';
    return '';
  };

  const parseSkuMeta = (sku) => {
    const normalizedSku = normalizeSkuFolder(sku).toUpperCase();
    const voltageMatch = normalizedSku.match(/-(74|111)-/);
    const voltage = voltageMatch ? voltageMatch[1] : '';
    const match = normalizedSku.match(/-(\d{3,4})$/);
    const capacity = match ? match[1] : '';
    return { voltage, capacity };
  };

  const getGroupHeadingConfig = (voltageLabel) => {
    if (voltageLabel === '7.4V') {
      return {
        title: '7.4V',
        i18n: 'common_voltage_74',
        eyebrow: 'type_page_' + seriesKey + '_catalog_eyebrow',
        primary: true
      };
    }
    if (voltageLabel === '11.1V') {
      return {
        title: '11.1V',
        i18n: 'common_voltage_111',
        eyebrow: '',
        primary: false
      };
    }
    return {
      title: voltageLabel || '',
      i18n: '',
      eyebrow: '',
      primary: false
    };
  };

  const buildGroupSection = (config, items) => {
    const section = document.createElement('section');
    section.className = 'series-group panel' + (config.primary ? ' series-group--primary' : '');

    const head = document.createElement('div');
    head.className = 'series-group__head';

    if (config.eyebrow) {
      const eyebrow = document.createElement('div');
      eyebrow.className = 'eyebrow';
      eyebrow.setAttribute('data-i18n', config.eyebrow);
      head.appendChild(eyebrow);
    }

    const heading = document.createElement('h3');
    heading.textContent = config.title;
    if (config.i18n) heading.setAttribute('data-i18n', config.i18n);
    head.appendChild(heading);

    const cardsWrap = document.createElement('div');
    cardsWrap.className = 'series-group__cards';
    cardsWrap.setAttribute('data-rail-track', '');

    items.forEach((card) => cardsWrap.appendChild(card));

    if (!items.length) {
      section.classList.add('is-hidden');
      section.hidden = true;
    }

    section.appendChild(head);
    section.appendChild(cardsWrap);
    return section;
  };

  const regroupSeriesCards = () => {
    const groupsRoot = document.querySelector('.series-groups');
    if (!groupsRoot) return [];

    const currentCards = Array.from(groupsRoot.querySelectorAll('.series-group .sku-card'));
    if (!currentCards.length) return [];

    const buckets = {
      '7.4V': [],
      '11.1V': []
    };

    currentCards.forEach((card) => {
      const voltageLabel = getVoltageGroupFromCard(card);
      if (!voltageLabel || !buckets[voltageLabel]) return;
      buckets[voltageLabel].push(card);
    });

    groupsRoot.innerHTML = '';
    ['7.4V', '11.1V'].forEach((voltageLabel) => {
      groupsRoot.appendChild(buildGroupSection(getGroupHeadingConfig(voltageLabel), buckets[voltageLabel] || []));
    });

    return Array.from(groupsRoot.querySelectorAll('.series-group .sku-card'));
  };

  const cards = regroupSeriesCards();
  if (!cards.length) return;

  const buildBaseCandidates = (basePath) => {
    if (!basePath) return [];
    return IMAGE_EXTENSIONS.map((ext) => `${basePath}.${ext}`);
  };

  const getDisplayModes = (model) => ({
    product: model?.hero || '',
    size: (Array.isArray(model?.skuImages) && model.skuImages[0]) || '',
    detail: (Array.isArray(model?.skuImages) && model.skuImages[1]) || ''
  });

  const applySeriesCardImageSource = (card, productModel) => {
    const visual = card.querySelector('.sku-card__visual');
    if (!visual) return '';

    let image = visual.querySelector('img');
    if (!image) {
      image = document.createElement('img');
      image.loading = 'lazy';
      image.decoding = 'async';
      image.alt = '';
      visual.appendChild(image);
    }

    const keyId = String(card?.dataset?.keyId || productModel?.sku || '').trim();
    const resolvedSrc = String(productModel?.hero || '').trim();
    visual.hidden = false;
    image.dataset.skuSource = keyId;
    image.dataset.resolvedSrc = resolvedSrc;

    if (resolvedSrc) {
      image.src = resolvedSrc;
    } else {
      image.removeAttribute('src');
    }

    return resolvedSrc;
  };

  const heroPanel = document.querySelector('.series-hero__panel');
  if ((seriesKey === 'slim' || seriesKey === 'block' || seriesKey === 'split' || seriesKey === 'stick') && heroPanel) heroPanel.setAttribute('aria-hidden', 'true');

  const getText = (scope, selector) => {
    const el = scope ? scope.querySelector(selector) : null;
    return el ? el.textContent.trim() : '';
  };

  const getVoltage = (card) => {
    if (seriesKey === 'slim' || seriesKey === 'block' || seriesKey === 'split' || seriesKey === 'stick') {
      const voltage = String(card?.dataset?.voltage || '').trim();
      if (voltage === '7.4') return '7.4V';
      if (voltage === '11.1') return '11.1V';
    }
    const group = card.closest('.series-group');
    const title = group ? group.querySelector('h3') : null;
    return title ? title.textContent.trim() : '7.4V / 11.1V';
  };

  const imageModes = [
    { key: 'product', label: 'PRODUCT' },
    { key: 'size', label: 'SIZE' },
    { key: 'detail', label: 'DETAIL' }
  ];

  const buildSizeText = (card) => {
    const voltage = getVoltage(card);
    const capacity = getText(card, '.sku-card__capacity');
    const tone = (card.dataset.capacityVisual || '').toLowerCase();
    const map = {
      small: 'SIZE / compact placeholder',
      medium: 'SIZE / standard placeholder',
      large: 'SIZE / extended placeholder'
    };
    return `${voltage} · ${capacity} · ${map[tone] || 'SIZE / placeholder'}`;
  };

  const allItems = [];

  const groupedByVoltageFromItems = (items) => items.reduce((acc, item) => {
    acc[item.voltage] = acc[item.voltage] || [];
    acc[item.voltage].push(item);
    return acc;
  }, {});

  const groupedByVoltage = {};
((acc, item) => {
    acc[item.voltage] = acc[item.voltage] || [];
    acc[item.voltage].push(item);
    return acc;
  }, {});

  const getSku = (card) => {
    const sku = card.querySelector('.sku-card__sku');
    return sku ? sku.textContent.trim().toUpperCase() : '';
  };

  const getCardModelText = (card) => {
    const sku = card.querySelector('.sku-card__sku');
    return sku ? sku.textContent.trim() : '';
  };

  const getCardCapacityText = (card) => {
    const capacity = card.querySelector('.sku-card__capacity');
    return capacity ? capacity.textContent.trim() : '';
  };

  const initSeriesModels = () => Promise.all(cards.map((card) => {
    const keyId = String(card?.dataset?.keyId || '').trim();
    const sku = getCardModelText(card);
    const productModelKey = keyId || sku;
    return buildProductModel(productModelKey).catch(() => ({ hero: '', skuImages: [], series: seriesKey, sku: normalizeSkuFolder(productModelKey) }))
      .then((productModel) => {
        const modeMap = getDisplayModes(productModel);
        const item = {
          card,
          key_id: keyId,
          voltage: getVoltage(card),
          capacity: getText(card, '.sku-card__capacity'),
          sku: getText(card, '.sku-card__sku'),
          productModel,
          modeMap,
          image: applySeriesCardImageSource(card, productModel) || modeMap.product || modeMap.size || modeMap.detail || '',
          sizeText: buildSizeText(card),
          tone: (card.dataset.capacityVisual || 'medium').toLowerCase()
        };
        allItems.push(item);
        return item;
      });
  })).then((items) => {
    const grouped = groupedByVoltageFromItems(items);
    Object.keys(groupedByVoltage).forEach((key) => delete groupedByVoltage[key]);
    Object.assign(groupedByVoltage, grouped);
    return items;
  });

  let activeItem = allItems[0];
  let activeMode = 'product';

  function markActiveCard() {
    cards.forEach((card) => card.classList.remove('is-active'));
    if (activeItem && activeItem.card) activeItem.card.classList.add('is-active');
  }

  const syncImageAnchor = (card) => {
    const visual = card.querySelector('.sku-card__visual');
    const image = visual ? visual.querySelector('img') : null;
    const anchor = visual ? visual.querySelector('.sku-card__image-anchor') : null;
    if (!visual || !image || !anchor) return;

    const visualRect = visual.getBoundingClientRect();
    const imageRect = image.getBoundingClientRect();

    if (!imageRect.width || !imageRect.height || !visualRect.width || !visualRect.height) {
      anchor.style.opacity = '0';
      return;
    }

    anchor.style.opacity = '1';
    anchor.style.left = `${imageRect.left - visualRect.left}px`;
    anchor.style.top = `${imageRect.top - visualRect.top}px`;
    anchor.style.width = `${imageRect.width}px`;
    anchor.style.height = `${imageRect.height}px`;
  };

  const applyAutoImageScale = (card) => {
    // R22I: image size is controlled by the normalized 1200x900 source canvas.
    // Do not calculate per-card runtime scale compensation.
    if (card) card.style.removeProperty('--sku-auto-scale');
  };

  const queueAutoImageScale = (() => {
    let frame = 0;
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        cards.forEach(applyAutoImageScale);
        cards.forEach(syncImageAnchor);
        frame = 0;
      });
    };
  })();

  const queueImageAnchorSync = (() => {
    let frame = 0;
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        cards.forEach(syncImageAnchor);
        frame = 0;
      });
    };
  })();

  initSeriesModels().then(() => {
    activeItem = allItems[0] || activeItem;

    const getWateliOverlayLang = () => {
      if (window.WATELI?.utils?.getStoredLang) return window.WATELI.utils.getStoredLang();
      try { return localStorage.getItem('wateli-lang') || 'en'; } catch (error) { return 'en'; }
    };

    const getWateliOverlayText = (key) => {
      const lang = getWateliOverlayLang();
      const dict = window.WATELI_TRANSLATIONS?.[lang] || window.WATELI_TRANSLATIONS?.en || {};
      return Object.prototype.hasOwnProperty.call(dict, key) ? dict[key] : key;
    };

    const syncWateliSkuOverlayI18n = (root = document) => {
      root.querySelectorAll?.('[data-wateli-overlay-i18n]').forEach((node) => {
        const key = node.dataset.wateliOverlayI18n;
        if (key) node.textContent = getWateliOverlayText(key);
      });
      root.querySelectorAll?.('[data-wateli-overlay-i18n-aria]').forEach((node) => {
        const key = node.dataset.wateliOverlayI18nAria;
        if (key) node.setAttribute('aria-label', getWateliOverlayText(key));
      });
      root.querySelectorAll?.('[data-i18n]').forEach((node) => {
        const key = node.dataset.i18n;
        if (key) node.textContent = getWateliOverlayText(key);
      });
      root.querySelectorAll?.('[data-i18n-attr]').forEach((node) => {
        const mapping = node.dataset.i18nAttr || '';
        const [attr, key] = mapping.split(':');
        if (attr && key) node.setAttribute(attr, getWateliOverlayText(key));
      });
    };

    const syncAllWateliSkuOverlayI18n = () => {
      syncWateliSkuOverlayI18n(document);
    };

    document.addEventListener('click', (event) => {
      if (!event.target.closest?.('[data-lang-btn]')) return;
      window.setTimeout(syncAllWateliSkuOverlayI18n, 160);
    });

    let wateliSkuOverlayActiveCard = null;
    let wateliSkuOverlayOutsideCloseHandler = null;

    const unbindWateliSkuOverlayOutsideClose = () => {
      if (!wateliSkuOverlayOutsideCloseHandler) return;
      document.removeEventListener('click', wateliSkuOverlayOutsideCloseHandler, true);
      wateliSkuOverlayOutsideCloseHandler = null;
      wateliSkuOverlayActiveCard = null;
    };

    const closeWateliSkuOverlay = (card) => {
      if (!card) return;
      card.classList.remove('wateli-overlay-open');
      const overlay = card.querySelector('.wateli-sku-local-overlay');
      if (overlay) overlay.setAttribute('aria-hidden', 'true');
      if (wateliSkuOverlayActiveCard === card) unbindWateliSkuOverlayOutsideClose();
    };

    const bindWateliSkuOverlayOutsideClose = (card) => {
      unbindWateliSkuOverlayOutsideClose();
      wateliSkuOverlayActiveCard = card;
      wateliSkuOverlayOutsideCloseHandler = (event) => {
        const activeCard = wateliSkuOverlayActiveCard;
        if (!activeCard) return;
        const overlay = activeCard.querySelector('.wateli-sku-local-overlay');
        const panel = overlay ? overlay.querySelector('.wateli-sku-local-overlay__panel') : null;
        if (panel && panel.contains(event.target)) return;
        if (event.target.closest?.('.wateli-sku-card-lens, .sku-card__visual')) return;
        if (!activeCard.contains(event.target)) closeWateliSkuOverlay(activeCard);
      };
      window.setTimeout(() => {
        if (wateliSkuOverlayOutsideCloseHandler) {
          document.addEventListener('click', wateliSkuOverlayOutsideCloseHandler, true);
        }
      }, 0);
    };

    const closeAllWateliSkuOverlays = (exceptCard) => {
      cards.forEach((card) => {
        if (card !== exceptCard) closeWateliSkuOverlay(card);
      });
    };

    const getWateliDetailUrl = (card) => {
      const keyId = card?.dataset?.keyId || '';
      const target = card?.dataset?.target || '';
      if (!keyId || !target) return '';
      return target + '?key_id=' + encodeURIComponent(keyId);
    };

    const applyWateliCurrentSku = (item) => {
      if (!item) return;
      activeItem = item;
      activeMode = 'product';
      markActiveCard();
    };

    const buildWateliSkuOverlay = (card, item) => {
      let overlay = card.querySelector('.wateli-sku-local-overlay');
      if (overlay) return overlay;

      const capacity = getCardCapacityText(card);
      const model = getCardModelText(card);

      overlay = document.createElement('div');
      overlay.className = 'wateli-sku-local-overlay';
      overlay.setAttribute('aria-hidden', 'true');
      overlay.innerHTML = `
        <button class=\"wateli-sku-local-overlay__backdrop\" type=\"button\" aria-label=\"×\"></button>
        <div class=\"wateli-sku-local-overlay__panel\" role=\"dialog\">
          <button class=\"wateli-sku-local-overlay__close\" type=\"button\" aria-label=\"×\">×</button>
          <div class=\"wateli-sku-local-overlay__meta\"><span class=\"wateli-sku-local-overlay__capacity\"></span><span class=\"wateli-sku-local-overlay__sep\">•</span><span class=\"wateli-sku-local-overlay__model\"></span></div>
          <p class=\"wateli-sku-local-overlay__copy\" data-wateli-overlay-i18n=\"product.choose_action\"></p>
          <div class=\"wateli-sku-local-overlay__actions\">
            <button class=\"wateli-sku-local-overlay__btn wateli-sku-local-overlay__btn--quick\" type=\"button\" data-wateli-overlay-i18n=\"product.quick_info\"></button>
            <button class=\"wateli-sku-local-overlay__btn wateli-sku-local-overlay__btn--detail\" type=\"button\" data-wateli-overlay-i18n=\"product.view_detail\"></button>
          </div>
        </div>
      `;
      overlay.querySelector('.wateli-sku-local-overlay__capacity').textContent = capacity;
      overlay.querySelector('.wateli-sku-local-overlay__model').textContent = model;
      syncWateliSkuOverlayI18n(overlay);

      overlay.querySelector('.wateli-sku-local-overlay__backdrop').addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        closeWateliSkuOverlay(card);
      });
      overlay.querySelector('.wateli-sku-local-overlay__close').addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        closeWateliSkuOverlay(card);
      });
      overlay.querySelector('.wateli-sku-local-overlay__btn--quick').addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        closeWateliSkuOverlay(card);
        openWateliQuickInfo(item);
      });
      overlay.querySelector('.wateli-sku-local-overlay__btn--detail').addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        const url = getWateliDetailUrl(card);
        if (url) window.location.href = url;
      });
      overlay.addEventListener('click', (event) => {
        event.stopPropagation();
      });

      card.appendChild(overlay);
      return overlay;
    };

    const openWateliSkuOverlay = (card, item) => {
      if (!card || !item) return;
      closeAllWateliSkuOverlays(card);
      const overlay = buildWateliSkuOverlay(card, item);
      syncWateliSkuOverlayI18n(overlay);
      overlay.setAttribute('aria-hidden', 'false');
      card.classList.add('wateli-overlay-open');
      bindWateliSkuOverlayOutsideClose(card);
    };

    const handleWateliQuickInfoEsc = (event) => {
      if (event.key !== 'Escape') return;
      const overlay = document.querySelector('.wateli-quick-info-root[aria-hidden="false"]');
      if (!overlay) return;
      event.preventDefault();
      event.stopPropagation();
      closeWateliQuickInfo();
    };

    function closeWateliQuickInfo() {
      const overlay = document.querySelector('.wateli-quick-info-root');
      if (!overlay) return;
      overlay.setAttribute('aria-hidden', 'true');
      document.documentElement.classList.remove('wateli-quick-info-open');
      document.body.classList.remove('wateli-qi-lock');
      document.removeEventListener('keydown', handleWateliQuickInfoEsc, true);
    }

    const openWateliQuickInfo = (item) => {
      let overlay = document.querySelector('.wateli-quick-info-root');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'wateli-quick-info-root';
        overlay.setAttribute('aria-hidden', 'true');
        overlay.innerHTML = `
          <div class="wateli-quick-info-backdrop" aria-hidden="true"></div>
          <section class="wateli-quick-info-panel" role="dialog" aria-modal="true" aria-label="" data-i18n-attr="aria-label:quickinfo.dialog_label">
            <button class="wateli-quick-info-close" type="button" aria-label="" data-i18n-attr="aria-label:quickinfo.close">×</button>
            <div class="wateli-quick-info-shell">
              <div class="wateli-quick-info-left">
                <div class="wateli-quick-info-main"><div class="wateli-quick-info-main-box"><img class="wateli-quick-info-image wateli-quick-info-image--hero" alt="" /></div></div>
                <div class="wateli-quick-info-thumbs" aria-label="" data-i18n-attr="aria-label:quickinfo.static_thumbnail_area">
                  <div class="wateli-quick-info-thumb"><img class="wateli-quick-info-image wateli-quick-info-image--thumb wateli-quick-info-image--thumb-hero" alt="" /></div>
                  <div class="wateli-quick-info-thumb"><img class="wateli-quick-info-image wateli-quick-info-image--thumb wateli-quick-info-image--thumb-size" alt="" /></div>
                  <div class="wateli-quick-info-thumb"><img class="wateli-quick-info-image wateli-quick-info-image--thumb wateli-quick-info-image--thumb-detail" alt="" /></div>
                </div>
              </div>
              <aside class="wateli-quick-info-right">
                <div class="wateli-quick-info-block">
                  <p class="wateli-quick-info-kicker" data-i18n="quickinfo.capacity"></p>
                  <ul class="wateli-quick-info-capacity-list"><li>780 mAh</li><li>950 mAh</li><li>1000 mAh</li><li>1200 mAh</li></ul>
                </div>
                <div class="wateli-quick-info-block wateli-quick-info-block-model">
                  <p class="wateli-quick-info-kicker" data-i18n="quickinfo.model_description"></p>
                  <h3 class="wateli-quick-info-title" data-i18n="quickinfo.title"></h3>
                  <p class="wateli-quick-info-copy" data-i18n="quickinfo.description"></p>
                </div>
              </aside>
            </div>
          </section>
        `;
        overlay.addEventListener('click', (event) => { event.stopPropagation(); });
        const panel = overlay.querySelector('.wateli-quick-info-panel');
        if (panel) panel.addEventListener('click', (event) => { event.stopPropagation(); });
        const closeButton = overlay.querySelector('.wateli-quick-info-close');
        if (closeButton) closeButton.addEventListener('click', (event) => { event.preventDefault(); event.stopPropagation(); closeWateliQuickInfo(); });
        document.body.appendChild(overlay);
      }

      const heroImage = overlay.querySelector('.wateli-quick-info-image--hero');
      const thumbHero = overlay.querySelector('.wateli-quick-info-image--thumb-hero');
      const thumbSize = overlay.querySelector('.wateli-quick-info-image--thumb-size');
      const thumbDetail = overlay.querySelector('.wateli-quick-info-image--thumb-detail');
      const capacityList = overlay.querySelector('.wateli-quick-info-capacity-list');
      const titleNode = overlay.querySelector('.wateli-quick-info-title');
      const copyNode = overlay.querySelector('.wateli-quick-info-copy');
      let quickInfoActiveKeyId = String(item?.key_id || item?.card?.dataset?.keyId || item?.productModel?.sku || '').trim();
      let activeQuickInfoImageKey = 'hero';
      let quickInfoImages = { hero: '', sku_1: '', sku_2: '' };

      const parseQuickInfoKeyId = (keyId) => {
        const parts = String(keyId || '').split('_');
        return { series: parts[0] || '', voltage: parts[1] || '' };
      };

      const getQuickInfoVariants = (keyId) => {
        const meta = parseQuickInfoKeyId(keyId);
        if (!meta.series || !meta.voltage) return [];
        const prefix = `${meta.series}_${meta.voltage}_`;
        return allItems.filter((entry) => String(entry?.key_id || entry?.card?.dataset?.keyId || '').startsWith(prefix)).sort((a, b) => {
          const aCapacity = parseInt(String(a?.capacity || '').replace(/\D/g, ''), 10) || 0;
          const bCapacity = parseInt(String(b?.capacity || '').replace(/\D/g, ''), 10) || 0;
          return aCapacity - bCapacity;
        });
      };

      const setQuickInfoImageNode = (imageNode, src) => {
        if (!imageNode) return;
        const normalizedSrc = String(src || '').trim();
        if (normalizedSrc) {
          imageNode.src = normalizedSrc;
          imageNode.classList.remove('is-missing');
          imageNode.removeAttribute('data-placeholder');
          return;
        }
        imageNode.removeAttribute('src');
        imageNode.classList.add('is-missing');
        imageNode.setAttribute('data-placeholder', 'true');
      };

      const setActiveQuickInfoImage = (key) => {
        if (!Object.prototype.hasOwnProperty.call(quickInfoImages, key)) return;
        activeQuickInfoImageKey = key;
        setQuickInfoImageNode(heroImage, quickInfoImages[activeQuickInfoImageKey]);
        [[thumbHero, 'hero'], [thumbSize, 'sku_1'], [thumbDetail, 'sku_2']].forEach(([thumb, thumbKey]) => {
          const thumbBox = thumb ? thumb.closest('.wateli-quick-info-thumb') : null;
          if (!thumbBox) return;
          thumbBox.classList.toggle('is-active', thumbKey === activeQuickInfoImageKey);
          thumbBox.setAttribute('aria-current', thumbKey === activeQuickInfoImageKey ? 'true' : 'false');
        });
      };

      const setQuickInfoImageSources = (modeMap) => {
        quickInfoImages = { hero: modeMap.product || '', sku_1: modeMap.size || '', sku_2: modeMap.detail || '' };
        setQuickInfoImageNode(thumbHero, quickInfoImages.hero);
        setQuickInfoImageNode(thumbSize, quickInfoImages.sku_1);
        setQuickInfoImageNode(thumbDetail, quickInfoImages.sku_2);
        activeQuickInfoImageKey = 'hero';
        setActiveQuickInfoImage(activeQuickInfoImageKey);
      };

      const updateQuickInfoText = (sourceItem) => {
        if (titleNode) {
          titleNode.removeAttribute('data-i18n');
          titleNode.textContent = sourceItem?.sku || '';
        }
        if (copyNode) {
          copyNode.removeAttribute('data-i18n');
          copyNode.textContent = `${sourceItem?.capacity || ''} • ${sourceItem?.sku || ''}`;
        }
      };

      const renderQuickInfoCapacityList = (variants) => {
        if (!capacityList) return;
        capacityList.innerHTML = '';
        variants.forEach((variant) => {
          const variantKeyId = String(variant?.key_id || variant?.card?.dataset?.keyId || '').trim();
          const li = document.createElement('li');
          li.textContent = variant?.capacity || '';
          li.setAttribute('role', 'button');
          li.setAttribute('tabindex', '0');
          li.classList.toggle('is-active', variantKeyId === quickInfoActiveKeyId);
          li.setAttribute('aria-current', variantKeyId === quickInfoActiveKeyId ? 'true' : 'false');
          const activateVariant = (event) => {
            event.preventDefault();
            event.stopPropagation();
            if (!variantKeyId || variantKeyId === quickInfoActiveKeyId) return;
            quickInfoActiveKeyId = variantKeyId;
            buildProductModel(variantKeyId).then((productModel) => {
              variant.productModel = productModel;
              variant.modeMap = getDisplayModes(productModel);
              updateQuickInfoFromItem(variant);
            }).catch(() => {});
          };
          li.addEventListener('click', activateVariant);
          li.addEventListener('keydown', (event) => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            activateVariant(event);
          });
          capacityList.appendChild(li);
        });
      };

      function updateQuickInfoFromItem(sourceItem) {
        if (!sourceItem) return;
        quickInfoActiveKeyId = String(sourceItem?.key_id || sourceItem?.card?.dataset?.keyId || '').trim();
        const modeMap = sourceItem.modeMap || getDisplayModes(sourceItem.productModel || {});
        setQuickInfoImageSources(modeMap);
        updateQuickInfoText(sourceItem);
        renderQuickInfoCapacityList(getQuickInfoVariants(quickInfoActiveKeyId));
      }

      [[thumbHero, 'hero'], [thumbSize, 'sku_1'], [thumbDetail, 'sku_2']].forEach(([thumb, key]) => {
        const thumbBox = thumb ? thumb.closest('.wateli-quick-info-thumb') : null;
        if (!thumbBox) return;
        thumbBox.setAttribute('role', 'button');
        thumbBox.setAttribute('tabindex', '0');
        thumbBox.onclick = (event) => {
          event.preventDefault();
          event.stopPropagation();
          setActiveQuickInfoImage(key);
        };
        thumbBox.onkeydown = (event) => {
          if (event.key !== 'Enter' && event.key !== ' ') return;
          event.preventDefault();
          event.stopPropagation();
          setActiveQuickInfoImage(key);
        };
      });

      updateQuickInfoFromItem(item);
      syncWateliSkuOverlayI18n(overlay);
      overlay.setAttribute('aria-hidden', 'false');
      document.documentElement.classList.add('wateli-quick-info-open');
      document.body.classList.add('wateli-qi-lock');
      document.removeEventListener('keydown', handleWateliQuickInfoEsc, true);
      document.addEventListener('keydown', handleWateliQuickInfoEsc, true);
    };

    cards.forEach((card) => {
    // CLEAN BASE: keep card navigation only; action layer disabled
    card.style.cursor = 'pointer';

    const item = allItems.find((entry) => entry.card === card);
    if (!item) return;

    const visual = card.querySelector('.sku-card__visual');
    const image = visual ? visual.querySelector('img') : null;
    if (!visual || !image) return;

    let anchor = visual.querySelector('.sku-card__image-anchor');
    if (!anchor) {
      anchor = document.createElement('div');
      anchor.className = 'sku-card__image-anchor';
      visual.appendChild(anchor);
    }

    let lens = anchor.querySelector('.wateli-sku-card-lens');
    if (!lens) {
      lens = document.createElement('button');
      lens.className = 'wateli-sku-card-lens';
      lens.type = 'button';
      lens.dataset.wateliOverlayI18nAria = 'product.choose_action';
      lens.setAttribute('aria-label', getWateliOverlayText('product.choose_action'));
      lens.textContent = '🔍';
      anchor.appendChild(lens);
    }
    lens.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      openWateliSkuOverlay(card, item);
    });

    image.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      openWateliSkuOverlay(card, item);
    });

    visual.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      openWateliSkuOverlay(card, item);
    });

    const bindImageAnchorSync = () => {
      queueAutoImageScale();
      if (typeof ResizeObserver === 'function' && !visual.__wateliResizeBound) {
        const resizeObserver = new ResizeObserver(() => queueAutoImageScale());
        resizeObserver.observe(visual);
        resizeObserver.observe(image);
        visual.__wateliResizeBound = true;
      }
      if (!image.__wateliLoadBound) {
        image.addEventListener('load', queueAutoImageScale);
        image.__wateliLoadBound = true;
      }
    };

    bindImageAnchorSync();

    card.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const cardEl = event.currentTarget;
      const keyId = String(cardEl?.dataset?.keyId || '').trim();
      const target = String(cardEl?.dataset?.target || '').trim();
      if (!keyId || !target) return;
      openWateliSkuOverlay(cardEl, item);
    });
    });

    window.addEventListener('resize', queueAutoImageScale, { passive: true });
    document.addEventListener('wateli:layout-ready', queueAutoImageScale);

    window.requestAnimationFrame(queueAutoImageScale);
    window.setTimeout(queueAutoImageScale, 120);
    document.dispatchEvent(new Event('wateli:layout-ready'));
  }).catch(() => {});
});
