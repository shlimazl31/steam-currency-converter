'use strict';

importScripts('shared.js');

const RATE_TTL = 24 * 60 * 60 * 1000;
const CURRENCY_TTL = 7 * RATE_TTL;
const API_ROOT = 'https://api.frankfurter.dev/v2';

chrome.runtime.onInstalled.addListener(async () => {
  const current = await chrome.storage.sync.get(SCC.DEFAULT_SETTINGS);
  await chrome.storage.sync.set(SCC.normalizeSettings(current));
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'GET_RATE') {
    getRate(message.base, message.quote).then(sendResponse);
    return true;
  }
  if (message?.type === 'GET_CURRENCIES') {
    getCurrencies().then(sendResponse);
    return true;
  }
  if (message?.type === 'GET_CACHE_STATUS') {
    getCacheStatus(message.base).then(sendResponse);
    return true;
  }
  return false;
});

async function getRate(baseInput, quoteInput) {
  const base = String(baseInput || '').toUpperCase();
  const quote = String(quoteInput || '').toUpperCase();
  if (!/^[A-Z]{3}$/.test(base) || !/^[A-Z]{3}$/.test(quote)) {
    return { ok: false, error: 'INVALID_CURRENCY' };
  }
  if (base === quote) {
    return { ok: true, rate: 1, base, quote, stale: false, fetchedAt: Date.now() };
  }

  const key = `rates:${base}`;
  const stored = (await chrome.storage.local.get(key))[key];
  const fresh = stored && Date.now() - stored.fetchedAt < RATE_TTL;
  if (fresh && Number.isFinite(stored.rates?.[quote])) {
    return rateResponse(stored, base, quote, false);
  }

  try {
    const response = await fetch(`${API_ROOT}/rates?base=${encodeURIComponent(base)}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP_${response.status}`);
    const rows = await response.json();
    if (!Array.isArray(rows)) throw new Error('INVALID_RESPONSE');

    const rates = { [base]: 1 };
    let date = '';
    for (const row of rows) {
      if (/^[A-Z]{3}$/.test(row.quote) && Number.isFinite(row.rate)) rates[row.quote] = row.rate;
      if (!date && row.date) date = row.date;
    }
    if (!Number.isFinite(rates[quote])) throw new Error('UNSUPPORTED_CURRENCY');

    const entry = { rates, date, fetchedAt: Date.now() };
    await chrome.storage.local.set({ [key]: entry });
    return rateResponse(entry, base, quote, false);
  } catch (error) {
    if (stored && Number.isFinite(stored.rates?.[quote])) return rateResponse(stored, base, quote, true);
    return { ok: false, base, quote, error: error.message || 'RATE_UNAVAILABLE' };
  }
}

function rateResponse(entry, base, quote, stale) {
  return {
    ok: true,
    base,
    quote,
    rate: entry.rates[quote],
    date: entry.date || '',
    fetchedAt: entry.fetchedAt,
    stale
  };
}

async function getCurrencies() {
  const key = 'currencies';
  const stored = (await chrome.storage.local.get(key))[key];
  if (stored && Date.now() - stored.fetchedAt < CURRENCY_TTL) return { ok: true, currencies: stored.items };

  try {
    const response = await fetch(`${API_ROOT}/currencies`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP_${response.status}`);
    const rows = await response.json();
    if (!Array.isArray(rows)) throw new Error('INVALID_RESPONSE');
    const items = rows
      .map((row) => ({ code: row.iso_code, name: row.name || row.iso_code }))
      .filter((row) => /^[A-Z]{3}$/.test(row.code))
      .sort((a, b) => a.code.localeCompare(b.code));
    if (!items.length) throw new Error('EMPTY_RESPONSE');
    await chrome.storage.local.set({ [key]: { items, fetchedAt: Date.now() } });
    return { ok: true, currencies: items };
  } catch (error) {
    const fallback = SCC.COMMON_CURRENCIES.map((code) => ({ code, name: code }));
    return { ok: true, currencies: stored?.items || fallback, stale: true, error: error.message };
  }
}

async function getCacheStatus(baseInput) {
  const base = String(baseInput || '').toUpperCase();
  const key = `rates:${base}`;
  const entry = (await chrome.storage.local.get(key))[key];
  return entry
    ? { ok: true, base, fetchedAt: entry.fetchedAt, date: entry.date || '', stale: Date.now() - entry.fetchedAt >= RATE_TTL }
    : { ok: false, base };
}
