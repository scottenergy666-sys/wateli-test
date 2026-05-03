(function () {
  'use strict';

  const HIDDEN_CLASS = 'is-hidden';

  function qs(selector, root = document) { return root.querySelector(selector); }
  function qsa(selector, root = document) { return Array.from(root.querySelectorAll(selector)); }
  function isNonEmpty(value) { return value !== null && value !== undefined && String(value).trim() !== ''; }
  function isNonEmptyImage(value) { return value !== null && value !== undefined && String(value).trim() !== ''; }

  function setText(el, value) {
    if (!el) return;
    el.textContent = value == null ? '' : String(value).trim();
  }

  function clearText(el) {
    if (!el) return;
    el.textContent = '';
  }

  function setMultilineTitle(el, value) {
    if (!el) return;
    const text = value == null ? '' : String(value).trim();
    const html = text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'))
      .join('<br>');
    el.innerHTML = html;
  }

  function showNode(el) { if (el) el.hidden = false; }
  function hideNode(el) { if (el) el.hidden = true; }
  function showSection(el) { if (el) el.classList.remove(HIDDEN_CLASS); }
  function hideSection(el) { if (el) el.classList.add(HIDDEN_CLASS); }

  function setLink(el, href, text) {
    if (!el) return;
    if (isNonEmpty(href)) el.setAttribute('href', href);
    else el.removeAttribute('href');
    setText(el, text);
  }

  function setImage(el, src, alt) {
    if (!el) return;
    if (isNonEmpty(src)) {
      el.setAttribute('src', src);
      el.setAttribute('alt', isNonEmpty(alt) ? alt : '');
      showNode(el);
    } else {
      el.removeAttribute('src');
      el.setAttribute('alt', isNonEmpty(alt) ? alt : '');
      hideNode(el);
    }
  }

  function getI18nText(key) {
    if (window.i18n && typeof window.i18n.t === 'function') return window.i18n.t(key);
    const map = {
      'spec.voltage': 'Voltage',
      'spec.capacity': 'Capacity',
      'spec.type': 'Type',
      'hero.card.form_factor': 'Form Factor',
      'hero.card.use_case': 'Use Case'
    };
    return map[key] || '';
  }

  function renderI18n(root = document) {
    qsa('[data-i18n]', root).forEach((node) => {
      setText(node, getI18nText(node.getAttribute('data-i18n')));
    });
  }

  function getHeroImage(data) {
    return data?.productModel?.hero || data?.hero_image || data?.heroImage || '';
  }

  function getSeriesImage(data) {
    return data?.productModel?.series || data?.series_slug || data?.seriesSlug || data?.series || '';
  }

  function getSkuImages(data) {
    const images = data?.productModel?.skuImages || data?.sku_images || data?.skuImages || [];
    return Array.isArray(images)
      ? images.filter((item) => isNonEmptyImage(item)).map((item) => String(item).trim())
      : [];
  }

  function parseBatteryType(data) {
    const raw = data?.battery_type || data?.type || data?.title || data?.hero_title_fmt || '';
    const m = String(raw).match(/Li[- ]?(?:ion|po)/i);
    return m ? m[0].replace(/ /g, '-') : '';
  }

  function resolveTitle(data) {
    const fmt = data?.hero_title_fmt;
    if (isNonEmpty(fmt)) {
      return String(fmt)
        .replace('{voltage}', data?.voltage || '')
        .replace('{capacity}', data?.capacity || '');
    }
    return data?.productName ?? data?.name ?? data?.title ?? data?.product_name ?? '';
  }

  function getHeroData(data) {
    return {
      title: resolveTitle(data),
      eyebrow: data?.heroEyebrow ?? data?.eyebrow ?? data?.seriesName ?? data?.series_name ?? '',
      sellingPoint: data?.sellingPoint ?? data?.selling_point ?? data?.tagline ?? data?.subtitle ?? data?.hero_lead ?? '',
      primaryCtaText: data?.primaryCtaText ?? data?.primary_cta_text ?? '尋找經銷商',
      primaryCtaLink: data?.primaryCtaLink ?? data?.primary_cta_link ?? 'dealer.html',
      secondaryCtaText: data?.secondaryCtaText ?? data?.secondary_cta_text ?? 'View Resources',
      secondaryCtaLink: data?.secondaryCtaLink ?? data?.secondary_cta_link ?? 'resources.html',
      heroImage: getHeroImage(data),
      heroImageAlt: data?.heroImageAlt ?? data?.hero_image_alt ?? data?.imageAlt ?? data?.image_alt ?? resolveTitle(data) ?? '',
      voltage: data?.voltage ?? '',
      capacity: data?.capacity ?? '',
      type: parseBatteryType(data),
      form_factor: data?.form_factor ?? data?.formFactor ?? data?.series_type ?? '',
      use_case: data?.use_case ?? data?.useCase ?? data?.meta2 ?? '',
      type_note: data?.type_note ?? data?.typeNote ?? '',
      use_case_note: data?.use_case_note ?? data?.useCaseNote ?? ''
    };
  }

  function renderHeroTitle(data, root) {
    const titleEl = qs('.product-hero__title', root);
    const title = data.title;
    if (!isNonEmpty(title)) return false;
    setMultilineTitle(titleEl, title);
    showNode(titleEl);
    return true;
  }

  function renderHeroEyebrow(data, root) {
    const eyebrowEl = qs('.product-hero__eyebrow', root);
    if (isNonEmpty(data.eyebrow)) {
      setText(eyebrowEl, data.eyebrow);
      showNode(eyebrowEl);
    } else {
      clearText(eyebrowEl);
      hideNode(eyebrowEl);
    }
  }

  function renderHeroSellingPoint(data, root) {
    const el = qs('.product-hero__selling-point', root);
    if (isNonEmpty(data.sellingPoint)) {
      setText(el, data.sellingPoint);
      showNode(el);
    } else {
      clearText(el);
      hideNode(el);
    }
  }

  function renderHeroActions(data, root) {
    const actionsEl = qs('.product-hero__actions', root);
    if (!actionsEl) return;
    actionsEl.innerHTML = '';
    let count = 0;

    if (isNonEmpty(data.primaryCtaText)) {
      const a = document.createElement('a');
      a.className = 'product-hero__cta product-hero__cta--primary';
      setLink(a, data.primaryCtaLink, data.primaryCtaText);
      actionsEl.appendChild(a);
      count++;
    }

    if (isNonEmpty(data.secondaryCtaText)) {
      const a = document.createElement('a');
      a.className = 'product-hero__cta product-hero__cta--secondary';
      setLink(a, data.secondaryCtaLink, data.secondaryCtaText);
      actionsEl.appendChild(a);
      count++;
    }

    if (count) showNode(actionsEl);
    else hideNode(actionsEl);
  }

  function renderHeroQuickTags(data, root) {
    [['voltage', data.voltage], ['capacity', data.capacity], ['type', data.type]].forEach(([k, v]) => {
      const el = qs('.product-hero__quick-tag-value[data-field="' + k + '"]', root);
      if (isNonEmpty(v)) {
        setText(el, v);
        showNode(el);
      } else {
        clearText(el);
        hideNode(el);
      }
    });
  }

  function renderHeroImage(data, root) {
    const imageEl = qs('.product-hero__image', root);
    setImage(imageEl, data.heroImage, data.heroImageAlt || data.title);
  }

  function renderHeroInfoCards(data, root) {
    const map = [
      ['form_factor', data.form_factor, data.type_note],
      ['use_case', data.use_case, data.use_case_note]
    ];

    map.forEach(([card, val, note]) => {
      const valueEl = qs('.product-hero__info-card[data-card="' + card + '"] .product-hero__info-card-value', root);
      const noteEl = qs('.product-hero__info-card[data-card="' + card + '"] .product-hero__info-card-text', root);
      if (isNonEmpty(val)) {
        setText(valueEl, val);
        showNode(valueEl);
      } else {
        clearText(valueEl);
        hideNode(valueEl);
      }
      if (isNonEmpty(note)) {
        setText(noteEl, note);
        showNode(noteEl);
      } else {
        clearText(noteEl);
        hideNode(noteEl);
      }
    });
  }

  function renderHero(rawData, root = document) {
    const heroSection = qs('.product-hero', root);
    if (!heroSection) return false;
    const data = getHeroData(rawData);
    renderI18n(heroSection);
    if (!renderHeroTitle(data, heroSection)) {
      hideSection(heroSection);
      return false;
    }
    showSection(heroSection);
    renderHeroEyebrow(data, heroSection);
    renderHeroSellingPoint(data, heroSection);
    renderHeroActions(data, heroSection);
    renderHeroQuickTags(data, heroSection);
    renderHeroImage(data, heroSection);
    renderHeroInfoCards(data, heroSection);
    return true;
  }

  function setHeroImageFromModel(src, alt, root = document) {
    const imageEl = qs('.product-hero__image', root);
    setImage(imageEl, src, alt);
  }

  window.WATELIImageSlots = {
    getHeroImage,
    getSeriesImage,
    getSkuImages
  };

  window.ProductHeroRenderer = {
    render: renderHero,
    rerender(data, root = document) {
      return renderHero(data, root);
    },
    setHeroImage: setHeroImageFromModel
  };
})();
