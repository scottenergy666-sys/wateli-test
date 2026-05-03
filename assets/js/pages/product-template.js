(function(){
  var params = new URLSearchParams(window.location.search);
  var rawSku = params.get('sku') || (window.location.hash ? window.location.hash.replace(/^#/, '') : '');

  function normalizeLegacySku(value){
    return String(value || '').toUpperCase().trim();
  }

  var legacySkuRedirectMap = {
    'TW-74-2000': { keyId: 'twin_74_2000', target: 'product-v2-74.html' },
    'TW-111-2000': { keyId: 'twin_111_2000', target: 'product-v2.html' },
    'SL-74-950': { keyId: 'slim_74_950', target: 'product-v2-74.html' },
    'SL-74-1000': { keyId: 'slim_74_1000', target: 'product-v2-74.html' },
    'SL-74-1200': { keyId: 'slim_74_1200', target: 'product-v2-74.html' },
    'SL-111-780': { keyId: 'slim_111_780', target: 'product-v2.html' },
    'SL-111-950': { keyId: 'slim_111_950', target: 'product-v2.html' },
    'SL-111-1000': { keyId: 'slim_111_1000', target: 'product-v2.html' },
    'SL-111-1200': { keyId: 'slim_111_1200', target: 'product-v2.html' },
    'BL-74-1300': { keyId: 'block_74_1300', target: 'product-v2-74.html' },
    'BL-111-1300': { keyId: 'block_111_1300', target: 'product-v2.html' },
    'SP-74-1000': { keyId: 'split_74_1000', target: 'product-v2-74.html' },
    'SP-111-950': { keyId: 'split_111_950', target: 'product-v2.html' },
    'SP-111-1000': { keyId: 'split_111_1000', target: 'product-v2.html' },
    'SP-111-1200': { keyId: 'split_111_1200', target: 'product-v2.html' },
    'ST-111-1000': { keyId: 'stick_111_1000', target: 'product-v2.html' }
  };

  function showMessage(message){
    var root = document.querySelector('[data-legacy-product-redirect-root]');
    if (!root) return;
    root.hidden = false;
    var messageEl = root.querySelector('[data-legacy-product-message]');
    if (messageEl) messageEl.textContent = message || '';
  }

  var normalizedRawSku = normalizeLegacySku(rawSku);
  if (!normalizedRawSku) {
    showMessage('Missing SKU parameter.');
    return;
  }

  var redirectEntry = legacySkuRedirectMap[normalizedRawSku] || null;
  if (redirectEntry && redirectEntry.keyId && redirectEntry.target) {
    window.location.replace(redirectEntry.target + '?key_id=' + encodeURIComponent(redirectEntry.keyId));
    return;
  }

  showMessage('This legacy SKU is no longer available on the old product page.');
})();
