(async function initPopup() {
  'use strict';

  const elements = {
    enabled: document.querySelector('#enabled'), target: document.querySelector('#targetCurrency'),
    source: document.querySelector('#sourceCurrency'), language: document.querySelector('#language'),
    sourceAuto: document.querySelector('#sourceAuto'), sourceManual: document.querySelector('#sourceManual'),
    statusDot: document.querySelector('#statusDot'), statusTitle: document.querySelector('#statusTitle'),
    statusDetail: document.querySelector('#statusDetail'), ratePreview: document.querySelector('#ratePreview'),
    ratePair: document.querySelector('#ratePair'), rateValue: document.querySelector('#rateValue')
  };

  let settings = SCC.normalizeSettings(await chrome.storage.sync.get(SCC.DEFAULT_SETTINGS));
  let currencies = SCC.COMMON_CURRENCIES.map((code) => ({ code, name: code }));
  let pageState = null;
  let currentLanguage = resolveLanguage();

  bindEvents();
  applyTranslations();
  renderSettings();

  const currencyResult = await chrome.runtime.sendMessage({ type: 'GET_CURRENCIES' }).catch(() => null);
  if (currencyResult?.ok) currencies = currencyResult.currencies;
  renderCurrencyOptions();
  pageState = await readPageState();
  await renderStatus();

  function bindEvents() {
    elements.enabled.addEventListener('change', () => save({ enabled: elements.enabled.checked }));
    elements.target.addEventListener('change', () => save({ targetCurrency: elements.target.value }));
    elements.source.addEventListener('change', () => save({ sourceCurrencyOverride: elements.source.value }));
    elements.language.addEventListener('change', async () => {
      await save({ language: elements.language.value }, false);
      currentLanguage = resolveLanguage();
      applyTranslations();
      renderCurrencyOptions();
      await renderStatus();
    });
    elements.sourceAuto.addEventListener('click', () => save({ sourceCurrencyMode: 'auto' }));
    elements.sourceManual.addEventListener('click', () => save({ sourceCurrencyMode: 'manual' }));
  }

  async function save(changes, refreshStatus = true) {
    settings = SCC.normalizeSettings({ ...settings, ...changes });
    await chrome.storage.sync.set(changes);
    renderSettings();
    if (refreshStatus) setTimeout(renderStatus, 80);
  }

  function renderSettings() {
    elements.enabled.checked = settings.enabled;
    elements.language.value = settings.language;
    elements.source.disabled = settings.sourceCurrencyMode !== 'manual';
    elements.sourceAuto.classList.toggle('active', settings.sourceCurrencyMode === 'auto');
    elements.sourceManual.classList.toggle('active', settings.sourceCurrencyMode === 'manual');
    document.body.classList.toggle('disabled', !settings.enabled);
  }

  function renderCurrencyOptions() {
    const target = settings.targetCurrency;
    const source = settings.sourceCurrencyOverride;
    const autoCurrency = SCC.currencyForLocale(navigator.language);
    elements.target.replaceChildren(option('AUTO', tr('autoCurrency', { currency: autoCurrency })));
    elements.source.replaceChildren();
    for (const currency of currencies) {
      const label = currency.name === currency.code ? currency.code : `${currency.code} — ${currency.name}`;
      elements.target.append(option(currency.code, label));
      elements.source.append(option(currency.code, label));
    }
    ensureOption(elements.target, target);
    ensureOption(elements.source, source);
    elements.target.value = target;
    elements.source.value = source;
    renderSettings();
  }

  async function renderStatus() {
    const disabled = !settings.enabled;
    elements.statusDot.className = `status-dot${disabled ? ' error' : ''}`;
    elements.ratePreview.hidden = true;
    if (disabled) {
      elements.statusTitle.textContent = tr('disabled');
      elements.statusDetail.textContent = '';
      return;
    }
    if (!pageState?.ok) {
      elements.statusDot.className = 'status-dot error';
      elements.statusTitle.textContent = tr('notSteam');
      elements.statusDetail.textContent = '';
      return;
    }

    elements.statusDot.className = 'status-dot ready';
    elements.statusTitle.textContent = tr('active');
    const detected = pageState.detectedCurrencies || [];
    const source = settings.sourceCurrencyMode === 'manual' ? settings.sourceCurrencyOverride : detected[0];
    if (pageState.lastError) elements.statusDetail.textContent = tr('apiError');
    else if (pageState.convertedCount) elements.statusDetail.textContent = tr('converted', { count: pageState.convertedCount, source: detected.length > 1 ? tr('multipleSources') : source });
    else elements.statusDetail.textContent = tr('noPrices');
    if (!source) return;

    const target = settings.targetCurrency === 'AUTO' ? SCC.currencyForLocale(navigator.language) : settings.targetCurrency;
    const result = await chrome.runtime.sendMessage({ type: 'GET_RATE', base: source, quote: target }).catch(() => null);
    if (!result?.ok) return;
    elements.ratePreview.hidden = false;
    elements.ratePair.textContent = tr('oneUnit', { source });
    elements.rateValue.textContent = SCC.formatCurrency(result.rate, target, currentLanguage.replace('_', '-'));
    if (result.stale || pageState.stale) elements.statusDetail.textContent += ` · ${tr('stale')}`;
  }

  async function readPageState() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id || !tab.url?.startsWith('https://store.steampowered.com/')) return null;
      return await chrome.tabs.sendMessage(tab.id, { type: 'GET_PAGE_STATE' });
    } catch {
      return null;
    }
  }

  function applyTranslations() {
    document.documentElement.lang = currentLanguage.replace('_', '-');
    document.querySelectorAll('[data-i18n]').forEach((node) => {
      node.textContent = tr(node.dataset.i18n);
    });
  }

  function resolveLanguage() {
    return settings.language === 'auto' ? SCC.languageForLocale(navigator.language) : settings.language;
  }

  function tr(key, replacements = {}) {
    let value = SCCPopupTranslations[currentLanguage]?.[key] || SCCPopupTranslations.en[key] || key;
    for (const [name, replacement] of Object.entries(replacements)) value = value.replaceAll(`{${name}}`, String(replacement ?? ''));
    return value;
  }

  function option(value, label) {
    const node = document.createElement('option');
    node.value = value;
    node.textContent = label;
    return node;
  }

  function ensureOption(select, value) {
    if (![...select.options].some((item) => item.value === value)) select.append(option(value, value));
  }
})();
