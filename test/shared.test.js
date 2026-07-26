'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const SCC = require('../src/shared.js');

test('parses localized Steam prices', () => {
  assert.deepEqual(SCC.parsePrice('1.234,56 €', 'de-DE'), { amount: 1234.56, currency: 'EUR', raw: '1.234,56 €' });
  assert.deepEqual(SCC.parsePrice('$1,234.56', 'en-US'), { amount: 1234.56, currency: 'USD', raw: '$1,234.56' });
  assert.deepEqual(SCC.parsePrice('53,50 zł', 'pl-PL'), { amount: 53.5, currency: 'PLN', raw: '53,50 zł' });
  assert.deepEqual(SCC.parsePrice('¥1,200', 'ja-JP'), { amount: 1200, currency: 'JPY', raw: '¥1,200' });
  assert.deepEqual(SCC.parsePrice('₺249,99', 'tr-TR'), { amount: 249.99, currency: 'TRY', raw: '₺249,99' });
});

test('handles explicit and regional currency symbols', () => {
  assert.equal(SCC.parsePrice('R$ 79,90', 'pt-BR').currency, 'BRL');
  assert.equal(SCC.parsePrice('A$ 12.99', 'en-AU').currency, 'AUD');
  assert.equal(SCC.parsePrice('199,00 PLN', 'en-US').currency, 'PLN');
  assert.equal(SCC.parsePrice('$19.99', 'en-CA').currency, 'CAD');
  assert.equal(SCC.parsePrice('¥88.00', 'zh-CN').currency, 'CNY');
});

test('rejects non-price Steam labels', () => {
  assert.equal(SCC.parsePrice('-75%', 'en-US'), null);
  assert.equal(SCC.parsePrice('Free to Play', 'en-US'), null);
  assert.equal(SCC.parsePrice('5,000 Points', 'en-US'), null);
  assert.equal(SCC.parsePrice('No price here', 'en-US'), null);
});

test('converts and formats amounts safely', () => {
  assert.equal(SCC.convertAmount(10, 2.5), 25);
  assert.equal(SCC.convertAmount('bad', 2), null);
  assert.match(SCC.formatCurrency(1234.56, 'USD', 'en-US'), /1,234\.56/);
  assert.match(SCC.formatCurrency(1200, 'JPY', 'ja-JP'), /1,200/);
});

test('chooses target currency from locale', () => {
  assert.equal(SCC.currencyForLocale('tr-TR'), 'TRY');
  assert.equal(SCC.currencyForLocale('de-DE'), 'EUR');
  assert.equal(SCC.currencyForLocale('en-GB'), 'GBP');
  assert.equal(SCC.currencyForLocale('unknown'), 'USD');
});

test('normalizes unsafe settings values', () => {
  const settings = SCC.normalizeSettings({ sourceCurrencyMode: 'other', targetCurrency: 'try', sourceCurrencyOverride: 'eur' });
  assert.equal(settings.sourceCurrencyMode, 'auto');
  assert.equal(settings.targetCurrency, 'TRY');
  assert.equal(settings.sourceCurrencyOverride, 'EUR');
});
