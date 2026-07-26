(function initContent() {
  'use strict';

  const PRICE_SELECTOR = [
    '.discount_final_price', '.discount_original_price', '.game_purchase_price',
    '.game_area_dlc_price', '.search_price', '.search_discount', '.normal_price',
    '.sale_price', '.price', '.match_price', '.your_price', '.cart_item_price',
    '.price_total', '.subtotal', '[data-price-final]'
  ].join(',');

  let settings = SCC.normalizeSettings();
  let locale = document.documentElement.lang || navigator.language || 'en-US';
  let observer;
  let scanTimer;
  let generation = 0;
  const ratePromises = new Map();
  const pageState = { detectedCurrencies: new Set(), convertedCount: 0, lastError: '', stale: false };

  start();

  async function start() {
    settings = SCC.normalizeSettings(await chrome.storage.sync.get(SCC.DEFAULT_SETTINGS));
    scanDocument();
    observer = new MutationObserver((mutations) => {
      if (mutations.every((mutation) => mutation.target.closest?.('.scc-converted-price'))) return;
      clearTimeout(scanTimer);
      scanTimer = setTimeout(scanDocument, 120);
    });
    observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  }

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'sync') return;
    const relevant = Object.keys(changes).some((key) => key in SCC.DEFAULT_SETTINGS);
    if (!relevant) return;
    chrome.storage.sync.get(SCC.DEFAULT_SETTINGS).then((stored) => {
      settings = SCC.normalizeSettings(stored);
      resetAndRescan();
    });
  });

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === 'GET_PAGE_STATE') {
      sendResponse({
        ok: true,
        detectedCurrencies: [...pageState.detectedCurrencies],
        convertedCount: pageState.convertedCount,
        lastError: pageState.lastError,
        stale: pageState.stale
      });
    }
  });

  function resetAndRescan() {
    generation += 1;
    ratePromises.clear();
    pageState.detectedCurrencies.clear();
    pageState.convertedCount = 0;
    pageState.lastError = '';
    pageState.stale = false;
    document.querySelectorAll('.scc-converted-price').forEach((node) => node.remove());
    document.querySelectorAll('[data-scc-key]').forEach((node) => {
      delete node.dataset.sccKey;
    });
    scanDocument();
  }

  function scanDocument() {
    if (!settings.enabled) return;
    const currentGeneration = generation;
    const elements = collectPriceElements();
    for (const element of elements) processElement(element, currentGeneration);
  }

  function collectPriceElements() {
    const elements = new Set(document.querySelectorAll(PRICE_SELECTOR));
    if (/^\/(?:wishlist|cart)(?:\/|$)/.test(location.pathname)) {
      const root = document.querySelector('#StoreTemplate') || document.body;
      for (const element of root.querySelectorAll('div, span')) {
        if (isModernPriceCandidate(element)) elements.add(element);
      }
    }
    return [...elements];
  }

  function isModernPriceCandidate(element) {
    if (element.children.length || element.closest('header, nav, footer, #global_header, #global_action_menu, #account_dropdown')) return false;
    const directText = [...element.childNodes]
      .filter((node) => node.nodeType === Node.TEXT_NODE)
      .map((node) => node.textContent || '')
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    return Boolean(directText && SCC.parsePrice(directText, locale));
  }

  async function processElement(element, currentGeneration) {
    if (!(element instanceof HTMLElement) || element.closest('.scc-converted-price')) return;
    if (element.querySelector(`${PRICE_SELECTOR}, .scc-converted-price`)) return;

    const raw = ownText(element);
    const parsed = SCC.parsePrice(raw, locale);
    if (!parsed || parsed.amount === 0) return;

    const source = settings.sourceCurrencyMode === 'manual' ? settings.sourceCurrencyOverride : parsed.currency;
    const target = settings.targetCurrency === 'AUTO' ? SCC.currencyForLocale(navigator.language) : settings.targetCurrency;
    if (!source || !target || source === target) return;

    pageState.detectedCurrencies.add(source);
    const key = `${raw}|${source}|${target}`;
    if (element.dataset.sccKey === key) return;
    element.dataset.sccKey = key;

    const rateResult = await requestRate(source, target);
    if (currentGeneration !== generation || !element.isConnected || element.dataset.sccKey !== key) return;
    if (!rateResult.ok) {
      delete element.dataset.sccKey;
      pageState.lastError = rateResult.error || 'RATE_UNAVAILABLE';
      return;
    }

    const converted = SCC.convertAmount(parsed.amount, rateResult.rate);
    if (converted === null) return;
    const badge = document.createElement('span');
    badge.className = 'scc-converted-price';
    badge.dataset.stale = String(Boolean(rateResult.stale));
    badge.textContent = SCC.formatCurrency(converted, target, locale);
    badge.title = rateResult.stale
      ? SCCI18n.t('staleRate', settings.language, locale)
      : SCCI18n.t('convertedPrice', settings.language, locale);
    element.append(document.createTextNode(' '), badge);
    pageState.convertedCount += 1;
    pageState.stale ||= Boolean(rateResult.stale);
  }

  function ownText(element) {
    const clone = element.cloneNode(true);
    clone.querySelectorAll('.scc-converted-price').forEach((node) => node.remove());
    return clone.textContent.replace(/\s+/g, ' ').trim();
  }

  function requestRate(base, quote) {
    const key = `${base}:${quote}`;
    if (!ratePromises.has(key)) {
      ratePromises.set(key, chrome.runtime.sendMessage({ type: 'GET_RATE', base, quote }).catch((error) => ({ ok: false, error: error.message })));
    }
    return ratePromises.get(key);
  }
})();
