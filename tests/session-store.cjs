'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const stores = require('../game/session-store.js');
const KEY = 'birthday-game:test:v1';

function memoryStorage(initial = null) {
  const values = new Map(initial === null ? [] : [[KEY, initial]]);
  return {
    values,
    readCount: 0,
    writeCount: 0,
    failRead: false,
    failWrite: false,
    getItem(key) {
      this.readCount += 1;
      if (this.failRead) throw new Error('Storage access denied');
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      this.writeCount += 1;
      if (this.failWrite) throw new Error('Quota exceeded');
      values.set(key, value);
    }
  };
}

test('the helper exports a browser global and CommonJS API', () => {
  const context = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../game/session-store.js'), 'utf8'), context);
  assert.equal(typeof context.window.BirthdayGameSessionStore.create, 'function');
  assert.equal(typeof stores.create, 'function');
});

test('initial empty storage is captured once and successful own writes advance the snapshot', () => {
  const storage = memoryStorage();
  const session = stores.create(storage, KEY);
  assert.deepEqual(session.read(), { status: 'ok', raw: null });
  assert.equal(storage.readCount, 1);
  session.read();
  assert.equal(storage.readCount, 1);
  assert.equal(session.write('{"score":100}').status, 'ok');
  assert.deepEqual(session.read(), { status: 'ok', raw: '{"score":100}' });
  assert.equal(session.check().status, 'ok');
  assert.equal(session.write('{"score":200}').status, 'ok');
  assert.equal(storage.values.get(KEY), '{"score":200}');
  assert.equal(session.hasConflict(), false);
});

test('closing a stale second context cannot roll a score back', () => {
  const oldGame = JSON.stringify({ score: 0 });
  const newGame = JSON.stringify({ score: 100 });
  const storage = memoryStorage(oldGame);
  const tabA = stores.create(storage, KEY);
  const tabB = stores.create(storage, KEY);
  assert.equal(tabA.write(newGame).status, 'ok');

  // This is the same write a stale tab's pagehide handler would attempt.
  assert.equal(tabB.write(oldGame).status, 'conflict');
  assert.equal(tabB.hasConflict(), true);
  assert.equal(storage.values.get(KEY), newGame);
  assert.equal(storage.writeCount, 1);

  const reloaded = stores.create(storage, KEY);
  assert.deepEqual(reloaded.read(), { status: 'ok', raw: newGame });
  assert.equal(reloaded.write(JSON.stringify({ score: 200 })).status, 'ok');
  assert.equal(storage.values.get(KEY), '{"score":200}');
});

test('a storage event check detects changes without attempting a write', () => {
  const storage = memoryStorage('first game');
  const session = stores.create(storage, KEY);
  storage.values.set(KEY, 'another tab’s game');
  assert.deepEqual(session.check(), { status: 'conflict', raw: 'first game' });
  assert.equal(session.hasConflict(), true);
  assert.equal(storage.writeCount, 0);
});

test('conflicts stay locked even if storage changes back to the original snapshot', () => {
  const storage = memoryStorage('original');
  const session = stores.create(storage, KEY);
  storage.values.set(KEY, 'changed');
  assert.equal(session.check().status, 'conflict');
  storage.values.set(KEY, 'original');
  assert.equal(session.check().status, 'conflict');
  assert.equal(session.write('new attempt').status, 'conflict');
  assert.equal(storage.values.get(KEY), 'original');
  assert.equal(storage.writeCount, 0);
});

test('externally clearing a game also prevents a stale tab from restoring it', () => {
  const storage = memoryStorage('old game');
  const session = stores.create(storage, KEY);
  storage.values.delete(KEY);
  assert.equal(session.write('old game').status, 'conflict');
  assert.equal(storage.values.has(KEY), false);
});

test('denied access to the localStorage property is unavailable rather than conflict', () => {
  const session = stores.create(() => { throw new Error('Access denied'); }, KEY);
  assert.deepEqual(session.read(), { status: 'unavailable', raw: null });
  assert.equal(session.write('game').status, 'unavailable');
  assert.equal(session.check().status, 'unavailable');
  assert.equal(session.hasConflict(), false);
});

test('an initial read failure never becomes permission to overwrite an unseen game', () => {
  const storage = memoryStorage('unseen existing game');
  storage.failRead = true;
  const session = stores.create(storage, KEY);
  assert.equal(session.read().status, 'unavailable');
  storage.failRead = false;
  assert.equal(session.write('empty new game').status, 'unavailable');
  assert.equal(storage.values.get(KEY), 'unseen existing game');
  assert.equal(storage.writeCount, 0);
  assert.deepEqual(stores.create(storage, KEY).read(), { status: 'ok', raw: 'unseen existing game' });
});

test('temporary read errors retain the baseline and are distinct from conflicts', () => {
  const storage = memoryStorage('original');
  const session = stores.create(storage, KEY);
  storage.failRead = true;
  assert.deepEqual(session.write('new'), { status: 'unavailable', raw: 'original' });
  assert.equal(session.hasConflict(), false);
  assert.equal(storage.writeCount, 0);
  storage.failRead = false;
  assert.equal(session.write('new').status, 'ok');
  assert.equal(storage.values.get(KEY), 'new');
});

test('failed writes do not advance the snapshot and can be retried if storage is unchanged', () => {
  const storage = memoryStorage('original');
  const session = stores.create(storage, KEY);
  storage.failWrite = true;
  assert.deepEqual(session.write('new'), { status: 'unavailable', raw: 'original' });
  assert.equal(session.hasConflict(), false);
  assert.equal(storage.values.get(KEY), 'original');
  storage.failWrite = false;
  assert.equal(session.write('new').status, 'ok');
  assert.equal(session.read().raw, 'new');
});

test('a changed save after a storage error is detected instead of silently retried', () => {
  const storage = memoryStorage('original');
  const session = stores.create(storage, KEY);
  storage.failWrite = true;
  assert.equal(session.write('my new game').status, 'unavailable');
  storage.failWrite = false;
  storage.values.set(KEY, 'another tab won');
  assert.equal(session.write('my new game').status, 'conflict');
  assert.equal(storage.values.get(KEY), 'another tab won');
});

test('identical writes still check for conflicts but avoid unnecessary storage writes', () => {
  const storage = memoryStorage('same');
  const session = stores.create(storage, KEY);
  assert.equal(session.write('same').status, 'ok');
  assert.equal(storage.writeCount, 0);
  storage.values.set(KEY, 'different');
  assert.equal(session.write('same').status, 'conflict');
  assert.equal(storage.writeCount, 0);
});

test('the helper preserves opaque raw saves and rejects non-string writes', () => {
  const storage = memoryStorage('{malformed JSON');
  const session = stores.create(() => storage, KEY);
  assert.equal(session.read().raw, '{malformed JSON');
  assert.throws(() => session.write({ score: 100 }), TypeError);
  assert.equal(storage.values.get(KEY), '{malformed JSON');
  assert.throws(() => stores.create(storage, ''), TypeError);
});
