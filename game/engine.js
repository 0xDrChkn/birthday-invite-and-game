(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.BirthdayGameEngine = api;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  const VERSION = 1;
  const MAX_EVENTS = 5000;

  function fail(code, message) {
    const error = new Error(message);
    error.code = code;
    throw error;
  }

  function isRecord(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
  }

  function textExists(value) {
    if (typeof value === 'string') return value.trim().length > 0;
    return isRecord(value) && Object.values(value).some(item => typeof item === 'string' && item.trim());
  }

  function validId(value) {
    return typeof value === 'string' && value.length > 0 && value.length <= 120;
  }

  function canonical(value) {
    if (value === undefined) return 'null';
    if (value === null || typeof value !== 'object') return JSON.stringify(value);
    if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
    return '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + canonical(value[key])).join(',') + '}';
  }

  // This is a content-change detector, not a password or a security boundary.
  function fingerprint(value) {
    const input = canonical(value);
    let first = 2166136261;
    let second = 2246822519;
    for (let index = 0; index < input.length; index += 1) {
      first = Math.imul(first ^ input.charCodeAt(index), 16777619);
      second = Math.imul(second ^ input.charCodeAt(index), 3266489917);
    }
    return (first >>> 0).toString(16).padStart(8, '0') + (second >>> 0).toString(16).padStart(8, '0');
  }

  function readPack(pack) {
    if (!isRecord(pack) || !validId(pack.id) || !Array.isArray(pack.categories) || !pack.categories.length || pack.categories.length > 12) {
      fail('invalid_pack', 'The question pack must have an ID and 1–12 categories.');
    }
    const clueIds = new Set();
    const clues = [];
    const content = [];
    pack.categories.forEach(category => {
      if (!isRecord(category) || !Array.isArray(category.clues) || category.clues.length > 10) {
        fail('invalid_pack', 'Each category must contain a clue list of at most 10 clues.');
      }
      content.push({ id: category.id, title: category.title || category.name, clues: category.clues });
      category.clues.forEach(clue => {
        if (!isRecord(clue) || !validId(clue.id) || clueIds.has(clue.id) || !Number.isSafeInteger(clue.value) || clue.value < 1 || clue.value > 1000000) {
          fail('invalid_pack', 'Each clue needs a unique ID and a positive whole-number value.');
        }
        clueIds.add(clue.id);
        clues.push({ id: clue.id, value: clue.value, playable: !clue.draft && textExists(clue.question) && textExists(clue.answer) });
      });
    });
    if (!clues.length) fail('invalid_pack', 'The question pack has no clues.');
    return { id: pack.id, fingerprint: fingerprint(content), clues };
  }

  function cleanNames(names) {
    if (!Array.isArray(names) || names.length < 2 || names.length > 6) fail('invalid_teams', 'Enter between two and six teams.');
    const normalized = names.map(name => {
      if (typeof name !== 'string') fail('invalid_name', 'Each team needs a name.');
      const result = name.trim();
      if (!result || result.length > 40 || /[\u0000-\u001f\u007f]/.test(result)) fail('invalid_name', 'Team names must be 1–40 characters without line breaks.');
      return result;
    });
    if (new Set(normalized.map(name => name.toLocaleLowerCase('en'))).size !== normalized.length) fail('duplicate_name', 'Give each team a different name.');
    return normalized;
  }

  function freeze(state) {
    ['teams', 'clueCatalog', 'attempts', 'history'].forEach(key => {
      state[key].forEach(item => Object.freeze(item));
      Object.freeze(state[key]);
    });
    Object.freeze(state.teamNames);
    Object.freeze(state.completedClueIds);
    return Object.freeze(state);
  }

  function initial(names, pack) {
    return freeze({
      version: VERSION,
      packId: pack.id,
      packFingerprint: pack.fingerprint,
      teamNames: names.slice(),
      teams: names.map((name, index) => ({ id: 'team-' + (index + 1), name, score: 0 })),
      clueCatalog: pack.clues.map(clue => ({ ...clue })),
      currentClueId: null,
      selectedTeamId: null,
      revealed: false,
      resolved: false,
      completedClueIds: [],
      attempts: [],
      history: [],
      undoIndex: -1
    });
  }

  function create(names, pack) {
    return initial(cleanNames(names), readPack(pack));
  }

  function getClue(state, clueId) {
    return state.clueCatalog.find(clue => clue.id === clueId) || null;
  }

  function requireCurrent(state) {
    if (!state.currentClueId) fail('no_clue', 'Open a clue first.');
    return getClue(state, state.currentClueId);
  }

  function eventShape(event, expectedKeys) {
    if (!isRecord(event) || Object.keys(event).sort().join(',') !== expectedKeys.slice().sort().join(',')) fail('invalid_history', 'The saved game contains an invalid action.');
  }

  function transition(state, event) {
    if (state.history.length >= MAX_EVENTS) fail('history_limit', 'This game has reached its action limit. Export or start a fresh game.');
    let next = { ...state };
    switch (event.type) {
      case 'open': {
        eventShape(event, ['type', 'clueId']);
        if (state.currentClueId) fail('clue_open', 'Finish or close the current clue first.');
        const clue = getClue(state, event.clueId);
        if (!clue) fail('unknown_clue', 'That clue is not in this question pack.');
        if (!clue.playable) fail('draft_clue', 'This clue still needs a question and answer.');
        if (state.completedClueIds.includes(clue.id)) fail('completed_clue', 'That clue has already been completed.');
        next.currentClueId = clue.id;
        next.revealed = false;
        next.resolved = state.attempts.some(attempt => attempt.clueId === clue.id && attempt.sign === 1);
        break;
      }
      case 'select':
        eventShape(event, ['type', 'teamId']);
        if (!state.teams.some(team => team.id === event.teamId)) fail('unknown_team', 'Choose one of the teams in this game.');
        if (state.selectedTeamId === event.teamId) return state;
        next.selectedTeamId = event.teamId;
        break;
      case 'reveal':
        eventShape(event, ['type']);
        requireCurrent(state);
        if (state.revealed) return state;
        next.revealed = true;
        break;
      case 'award': {
        eventShape(event, ['type', 'sign']);
        const clue = requireCurrent(state);
        if (event.sign !== 1 && event.sign !== -1) fail('invalid_award', 'Choose correct or incorrect.');
        if (!state.selectedTeamId) fail('no_team', 'Choose the answering team first.');
        if (state.resolved) fail('resolved_clue', 'A correct answer has already resolved this clue.');
        if (state.attempts.some(attempt => attempt.clueId === clue.id && attempt.teamId === state.selectedTeamId)) fail('duplicate_award', 'This team has already attempted the clue. Undo to change the decision.');
        next.teams = state.teams.map(team => team.id === state.selectedTeamId ? { ...team, score: team.score + event.sign * clue.value } : team);
        next.attempts = state.attempts.concat({ clueId: clue.id, teamId: state.selectedTeamId, sign: event.sign, value: clue.value });
        next.resolved = event.sign === 1;
        next.undoIndex = state.history.length;
        break;
      }
      case 'finish': {
        eventShape(event, ['type']);
        const clue = requireCurrent(state);
        next.completedClueIds = state.completedClueIds.concat(clue.id);
        if (!state.attempts.some(attempt => attempt.clueId === clue.id)) next.undoIndex = state.history.length;
        next.currentClueId = null;
        next.revealed = false;
        next.resolved = false;
        break;
      }
      case 'cancel':
        eventShape(event, ['type']);
        requireCurrent(state);
        next.currentClueId = null;
        next.revealed = false;
        next.resolved = false;
        break;
      default:
        fail('invalid_history', 'The saved game contains an unknown action.');
    }
    next.history = state.history.concat({ ...event });
    return freeze(next);
  }

  function replay(names, pack, history) {
    if (!Array.isArray(history) || history.length > MAX_EVENTS) fail('invalid_history', 'The saved game action list is invalid.');
    return history.reduce((state, event) => {
      if (!isRecord(event)) fail('invalid_history', 'The saved game contains an invalid action.');
      return transition(state, event);
    }, initial(names, pack));
  }

  function canUndo(state) {
    return state.undoIndex >= 0;
  }

  function undo(state) {
    if (!canUndo(state)) return state;
    // Remove the latest score decision and later navigation/completion in one
    // operation. A clue finished without scoring is its own undo boundary.
    return replay(state.teamNames, { id: state.packId, fingerprint: state.packFingerprint, clues: state.clueCatalog }, state.history.slice(0, state.undoIndex));
  }

  function serialize(state) {
    return JSON.stringify({
      version: VERSION,
      packId: state.packId,
      packFingerprint: state.packFingerprint,
      teamNames: state.teamNames,
      history: state.history
    });
  }

  function restore(saved, pack) {
    try {
      if (typeof saved === 'string') {
        if (saved.length > 2000000) return null;
        saved = JSON.parse(saved);
      }
      if (!isRecord(saved) || saved.version !== VERSION) return null;
      const currentPack = readPack(pack);
      if (saved.packId !== currentPack.id || saved.packFingerprint !== currentPack.fingerprint) return null;
      return replay(cleanNames(saved.teamNames), currentPack, saved.history);
    } catch (_) {
      return null;
    }
  }

  function isComplete(state) {
    const playable = state.clueCatalog.filter(clue => clue.playable);
    return playable.length > 0 && playable.every(clue => state.completedClueIds.includes(clue.id));
  }

  return Object.freeze({
    VERSION,
    create,
    openClue: (state, clueId) => transition(state, { type: 'open', clueId }),
    selectTeam: (state, teamId) => transition(state, { type: 'select', teamId }),
    reveal: state => transition(state, { type: 'reveal' }),
    award: (state, deltaSign) => transition(state, { type: 'award', sign: deltaSign }),
    finishClue: state => transition(state, { type: 'finish' }),
    cancelClue: state => transition(state, { type: 'cancel' }),
    undo,
    canUndo,
    getClue,
    isComplete,
    serialize,
    restore
  });
});
