'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const translations = require('../popup/translations.js');

test('all popup languages contain the same translation keys', () => {
  const expected = Object.keys(translations.en).sort();
  assert.deepEqual(Object.keys(translations).sort(), ['de', 'en', 'es', 'fr', 'pt_BR', 'ru', 'tr']);
  for (const [language, messages] of Object.entries(translations)) {
    assert.deepEqual(Object.keys(messages).sort(), expected, `${language} has missing or extra keys`);
    for (const [key, value] of Object.entries(messages)) assert.ok(value.trim(), `${language}.${key} is empty`);
  }
});
