'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const SCC = require('../src/shared.js');

const backgroundSource = fs.readFileSync(path.join(__dirname, '../src/background.js'), 'utf8');

function createHarness({ fetchImpl, localData = {} }) {
  const listeners = [];
  const installedListeners = [];
  const local = { ...localData };
  const sync = {};
  const storageArea = (store) => ({
    async get(query) {
      if (typeof query === 'string') return { [query]: store[query] };
      if (Array.isArray(query)) return Object.fromEntries(query.map((key) => [key, store[key]]));
      return { ...(query || {}), ...store };
    },
    async set(values) { Object.assign(store, values); }
  });

  const context = vm.createContext({
    SCC,
    fetch: fetchImpl,
    importScripts() {},
    console,
    Date,
    encodeURIComponent,
    chrome: {
      runtime: {
        onInstalled: { addListener(listener) { installedListeners.push(listener); } },
        onMessage: { addListener(listener) { listeners.push(listener); } }
      },
      storage: { local: storageArea(local), sync: storageArea(sync) }
    }
  });
  vm.runInContext(backgroundSource, context, { filename: 'background.js' });

  async function send(message) {
    return new Promise((resolve) => {
      const asyncResponse = listeners[0](message, {}, resolve);
      assert.equal(asyncResponse, true);
    });
  }

  return { local, send };
}

test('fetches rates once and reuses the 24-hour cache', async () => {
  let fetchCount = 0;
  const harness = createHarness({
    fetchImpl: async () => {
      fetchCount += 1;
      return {
        ok: true,
        async json() {
          return [
            { date: '2026-07-05', base: 'USD', quote: 'EUR', rate: 0.87 },
            { date: '2026-07-05', base: 'USD', quote: 'TRY', rate: 46.75 }
          ];
        }
      };
    }
  });

  const first = await harness.send({ type: 'GET_RATE', base: 'usd', quote: 'try' });
  const second = await harness.send({ type: 'GET_RATE', base: 'USD', quote: 'EUR' });
  assert.equal(first.ok, true);
  assert.equal(first.rate, 46.75);
  assert.equal(first.stale, false);
  assert.equal(second.rate, 0.87);
  assert.equal(fetchCount, 1);
  assert.ok(harness.local['rates:USD']);
});

test('uses a stale cached rate when the network fails', async () => {
  const harness = createHarness({
    fetchImpl: async () => { throw new Error('offline'); },
    localData: {
      'rates:USD': { rates: { USD: 1, TRY: 40 }, date: '2026-01-01', fetchedAt: 1 }
    }
  });

  const result = await harness.send({ type: 'GET_RATE', base: 'USD', quote: 'TRY' });
  assert.equal(result.ok, true);
  assert.equal(result.rate, 40);
  assert.equal(result.stale, true);
});

test('returns an explicit error when no rate or cache exists', async () => {
  const harness = createHarness({ fetchImpl: async () => { throw new Error('offline'); } });
  const result = await harness.send({ type: 'GET_RATE', base: 'USD', quote: 'TRY' });
  assert.equal(result.ok, false);
  assert.equal(result.error, 'offline');
});

test('rejects invalid currency messages without fetching', async () => {
  let fetched = false;
  const harness = createHarness({ fetchImpl: async () => { fetched = true; } });
  const result = await harness.send({ type: 'GET_RATE', base: 'US', quote: 'TRY' });
  assert.deepEqual({ ok: result.ok, error: result.error }, { ok: false, error: 'INVALID_CURRENCY' });
  assert.equal(fetched, false);
});
