(function initShared(global) {
  'use strict';

  const DEFAULT_SETTINGS = Object.freeze({
    enabled: true,
    targetCurrency: 'AUTO',
    sourceCurrencyMode: 'auto',
    sourceCurrencyOverride: 'USD',
    language: 'auto'
  });

  const COMMON_CURRENCIES = Object.freeze([
    'AED', 'ARS', 'AUD', 'BRL', 'CAD', 'CHF', 'CLP', 'CNY', 'COP', 'CZK',
    'DKK', 'EUR', 'GBP', 'HKD', 'HUF', 'IDR', 'ILS', 'INR', 'JPY', 'KRW',
    'KZT', 'MXN', 'MYR', 'NOK', 'NZD', 'PEN', 'PHP', 'PLN', 'QAR', 'RON',
    'RUB', 'SAR', 'SEK', 'SGD', 'THB', 'TRY', 'TWD', 'UAH', 'USD', 'UYU',
    'VND', 'ZAR'
  ]);

  const REGION_CURRENCY = Object.freeze({
    AE: 'AED', AR: 'ARS', AU: 'AUD', BR: 'BRL', CA: 'CAD', CH: 'CHF',
    CL: 'CLP', CN: 'CNY', CO: 'COP', CZ: 'CZK', DK: 'DKK', GB: 'GBP',
    HK: 'HKD', HU: 'HUF', ID: 'IDR', IL: 'ILS', IN: 'INR', JP: 'JPY',
    KR: 'KRW', KZ: 'KZT', MX: 'MXN', MY: 'MYR', NO: 'NOK', NZ: 'NZD',
    PE: 'PEN', PH: 'PHP', PL: 'PLN', QA: 'QAR', RO: 'RON', RU: 'RUB',
    SA: 'SAR', SE: 'SEK', SG: 'SGD', TH: 'THB', TR: 'TRY', TW: 'TWD',
    UA: 'UAH', US: 'USD', UY: 'UYU', VN: 'VND', ZA: 'ZAR'
  });

  const EURO_REGIONS = new Set([
    'AT', 'BE', 'CY', 'DE', 'EE', 'ES', 'FI', 'FR', 'GR', 'HR', 'IE',
    'IT', 'LT', 'LU', 'LV', 'MT', 'NL', 'PT', 'SI', 'SK'
  ]);

  const SYMBOL_RULES = Object.freeze([
    ['R$', 'BRL'], ['A$', 'AUD'], ['AU$', 'AUD'], ['CA$', 'CAD'], ['C$', 'CAD'],
    ['NZ$', 'NZD'], ['HK$', 'HKD'], ['S$', 'SGD'], ['NT$', 'TWD'], ['MX$', 'MXN'],
    ['₺', 'TRY'], ['TL', 'TRY'], ['€', 'EUR'], ['£', 'GBP'], ['₽', 'RUB'],
    ['₴', 'UAH'], ['₹', 'INR'], ['₩', 'KRW'], ['₪', 'ILS'], ['zł', 'PLN'],
    ['Kč', 'CZK'], ['Ft', 'HUF'], ['lei', 'RON'], ['฿', 'THB'], ['₫', 'VND'],
    ['Rp', 'IDR'], ['RM', 'MYR'], ['₱', 'PHP'], ['R ', 'ZAR']
  ]);

  function normalizeLocale(locale) {
    return String(locale || 'en').replace('_', '-');
  }

  function localeRegion(locale) {
    const normalized = normalizeLocale(locale);
    const parts = normalized.split('-');
    const region = parts.find((part, index) => index > 0 && /^[A-Za-z]{2}$/.test(part));
    return region ? region.toUpperCase() : '';
  }

  function currencyForLocale(locale) {
    const normalized = normalizeLocale(locale);
    const region = localeRegion(normalized);
    if (REGION_CURRENCY[region]) return REGION_CURRENCY[region];
    if (EURO_REGIONS.has(region)) return 'EUR';
    if (/^tr\b/i.test(normalized)) return 'TRY';
    if (/^ja\b/i.test(normalized)) return 'JPY';
    if (/^ko\b/i.test(normalized)) return 'KRW';
    if (/^zh\b/i.test(normalized)) return region === 'TW' ? 'TWD' : 'CNY';
    if (/^ru\b/i.test(normalized)) return 'RUB';
    return 'USD';
  }

  function languageForLocale(locale) {
    const normalized = normalizeLocale(locale).toLowerCase();
    if (normalized.startsWith('pt')) return 'pt_BR';
    const base = normalized.split('-')[0];
    return ['tr', 'en', 'de', 'es', 'fr', 'ru'].includes(base) ? base : 'en';
  }

  function parseAmountToken(token) {
    let value = String(token || '')
      .replace(/[\s\u00a0\u202f'’]/g, '')
      .replace(/[^0-9.,-]/g, '');

    if (!/\d/.test(value)) return null;

    const comma = value.lastIndexOf(',');
    const dot = value.lastIndexOf('.');
    let decimalSeparator = '';

    if (comma >= 0 && dot >= 0) {
      decimalSeparator = comma > dot ? ',' : '.';
    } else {
      const separator = comma >= 0 ? ',' : dot >= 0 ? '.' : '';
      if (separator) {
        const parts = value.split(separator);
        const lastLength = parts.at(-1).length;
        if (lastLength === 1 || lastLength === 2) decimalSeparator = separator;
      }
    }

    if (decimalSeparator) {
      const groupSeparator = decimalSeparator === ',' ? '.' : ',';
      value = value.replaceAll(groupSeparator, '');
      const index = value.lastIndexOf(decimalSeparator);
      value = `${value.slice(0, index).replaceAll(decimalSeparator, '')}.${value.slice(index + 1)}`;
    } else {
      value = value.replace(/[.,]/g, '');
    }

    const amount = Number(value);
    return Number.isFinite(amount) && amount >= 0 ? amount : null;
  }

  function inferAmbiguousSymbol(text, locale) {
    if (text.includes('¥')) {
      return currencyForLocale(locale) === 'CNY' ? 'CNY' : 'JPY';
    }
    if (/\bkr\b/i.test(text)) {
      const currency = currencyForLocale(locale);
      return ['DKK', 'NOK', 'SEK'].includes(currency) ? currency : null;
    }
    if (text.includes('$')) {
      const currency = currencyForLocale(locale);
      return ['ARS', 'AUD', 'BRL', 'CAD', 'CLP', 'COP', 'HKD', 'MXN', 'NZD', 'SGD', 'TWD', 'USD', 'UYU'].includes(currency)
        ? currency
        : 'USD';
    }
    return null;
  }

  function detectCurrency(text, locale) {
    const raw = String(text || '').trim();
    const explicit = raw.match(/(?:^|[^A-Z])([A-Z]{3})(?=$|[^A-Z])/);
    if (explicit && COMMON_CURRENCIES.includes(explicit[1])) return explicit[1];

    for (const [symbol, currency] of SYMBOL_RULES) {
      if (raw.includes(symbol)) return currency;
    }
    return inferAmbiguousSymbol(raw, locale);
  }

  function parsePrice(text, locale = 'en-US') {
    const raw = String(text || '').replace(/[\u00a0\u202f]/g, ' ').trim();
    if (!raw || /(?:free|ücretsiz|kostenlos|gratuit|gratis|бесплатно|play for free)/i.test(raw)) return null;
    if (/^\s*-?\d+(?:[.,]\d+)?\s*%\s*$/.test(raw)) return null;
    if (/\b(?:points?|puan|puntos?|punkte|точек|pontos?)\b/i.test(raw)) return null;

    const currency = detectCurrency(raw, locale);
    if (!currency) return null;
    const numberMatch = raw.match(/-?\d[\d\s\u00a0\u202f.,'’]*/);
    if (!numberMatch) return null;
    const amount = parseAmountToken(numberMatch[0]);
    if (amount === null) return null;

    return { amount, currency, raw };
  }

  function convertAmount(amount, rate) {
    const result = Number(amount) * Number(rate);
    return Number.isFinite(result) ? result : null;
  }

  function formatCurrency(amount, currency, locale = 'en-US') {
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        maximumFractionDigits: ['JPY', 'KRW', 'VND', 'CLP'].includes(currency) ? 0 : 2
      }).format(amount);
    } catch {
      return `${Number(amount).toFixed(2)} ${currency}`;
    }
  }

  function normalizeSettings(settings) {
    const merged = { ...DEFAULT_SETTINGS, ...(settings || {}) };
    if (merged.targetCurrency !== 'AUTO') merged.targetCurrency = String(merged.targetCurrency).toUpperCase();
    if (!['auto', 'manual'].includes(merged.sourceCurrencyMode)) merged.sourceCurrencyMode = 'auto';
    merged.sourceCurrencyOverride = String(merged.sourceCurrencyOverride || 'USD').toUpperCase();
    return merged;
  }

  const api = {
    COMMON_CURRENCIES,
    DEFAULT_SETTINGS,
    convertAmount,
    currencyForLocale,
    detectCurrency,
    formatCurrency,
    languageForLocale,
    normalizeSettings,
    parseAmountToken,
    parsePrice
  };

  global.SCC = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(globalThis);
