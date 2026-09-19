(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.BirthdayGameSessionStore = api;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  /**
   * Keep a tab's last observed raw save separate from its in-memory game.
   * A conflicting tab must reload before writing again; there is no merging.
   * Pass storage itself or a getter so denied window.localStorage access can
   * be reported as unavailable without stopping the rest of the game.
   */
  function create(storageOrGetter, key) {
    if (typeof key !== 'string' || !key) throw new TypeError('A storage key is required.');

    let storage;
    let snapshot = null;
    let initialized = false;
    let conflicted = false;
    let status = 'unavailable';

    function result() {
      return Object.freeze({ status, raw: initialized ? snapshot : null });
    }

    function getRaw() {
      const raw = storage.getItem(key);
      if (raw !== null && typeof raw !== 'string') throw new TypeError('Storage returned an invalid value.');
      return raw;
    }

    try {
      storage = typeof storageOrGetter === 'function' ? storageOrGetter() : storageOrGetter;
      snapshot = getRaw();
      initialized = true;
      status = 'ok';
    } catch (_) {
      // With no initial snapshot, never guess that the store was empty.
      // A fresh instance/reload is needed to read any previously unseen game.
    }

    function read() {
      return result();
    }

    function check() {
      if (conflicted) {
        status = 'conflict';
        return result();
      }
      if (!initialized) {
        status = 'unavailable';
        return result();
      }
      try {
        if (getRaw() !== snapshot) {
          conflicted = true;
          status = 'conflict';
        } else {
          status = 'ok';
        }
      } catch (_) {
        status = 'unavailable';
      }
      return result();
    }

    function write(raw) {
      if (typeof raw !== 'string') throw new TypeError('Serialize the game before saving it.');
      if (check().status !== 'ok') return result();
      if (raw === snapshot) return result();
      try {
        storage.setItem(key, raw);
        snapshot = raw;
        status = 'ok';
      } catch (_) {
        status = 'unavailable';
      }
      return result();
    }

    return Object.freeze({ read, check, write, hasConflict: () => conflicted });
  }

  return Object.freeze({ create });
});
