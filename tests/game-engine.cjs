'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const game = require('../game/engine.js');

function pack() {
  return {
    id: 'test-party',
    categories: [
      { id: 'films', title: 'Films', clues: [
        { id: 'film-100', value: 100, question: 'Question one', answer: 'Answer one' },
        { id: 'film-500', value: 500, question: 'Question two', answer: 'Answer two' }
      ] },
      { id: 'personal', title: 'Personal', clues: [
        { id: 'draft-100', value: 100, question: 'Not reviewed', answer: 'Not reviewed', draft: true },
        { id: 'missing-200', value: 200, question: 'Waiting for the host' }
      ] }
    ]
  };
}

function start() {
  return game.create(['The Pearls', 'The Bootleggers'], pack());
}

function openForTeam(state, clueId = 'film-100', teamId = 'team-1') {
  return game.selectTeam(game.openClue(state, clueId), teamId);
}

function code(expected) {
  return error => error.code === expected;
}

test('the same engine is available as a browser global', () => {
  const context = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../game/engine.js'), 'utf8'), context);
  assert.equal(typeof context.window.BirthdayGameEngine.create, 'function');
});

test('two through six teams start with stable IDs and zero points', () => {
  for (let count = 2; count <= 6; count += 1) {
    const state = game.create(Array.from({ length: count }, (_, index) => 'Team ' + index), pack());
    assert.equal(state.teams.length, count);
    assert.deepEqual(state.teams.map(team => team.score), Array(count).fill(0));
    assert.equal(state.teams[count - 1].id, 'team-' + count);
  }
  assert.throws(() => game.create(['Alone'], pack()), code('invalid_teams'));
  assert.throws(() => game.create(Array.from({ length: 7 }, (_, index) => String(index)), pack()), code('invalid_teams'));
});

test('names are bounded data, preserve untrusted text, and cannot collide', () => {
  const state = game.create(['  <img src=x onerror=alert(1)>  ', 'Second team'], pack());
  assert.equal(state.teams[0].name, '<img src=x onerror=alert(1)>');
  assert.throws(() => game.create(['Gold', ' gold '], pack()), code('duplicate_name'));
  assert.throws(() => game.create(['\n', 'Two'], pack()), code('invalid_name'));
  assert.throws(() => game.create(['a'.repeat(41), 'Two'], pack()), code('invalid_name'));
  assert.throws(() => game.create([{ toString: () => 'Injected' }, 'Two'], pack()), code('invalid_name'));
});

test('wrong answers deduct points; a different team can then win the clue', () => {
  let state = openForTeam(start(), 'film-500');
  state = game.award(state, -1);
  assert.equal(state.teams[0].score, -500);
  assert.equal(state.resolved, false);
  assert.throws(() => game.award(state, -1), code('duplicate_award'));
  assert.throws(() => game.award(state, 1), code('duplicate_award'));
  state = game.selectTeam(state, 'team-2');
  state = game.award(state, 1);
  assert.deepEqual(state.teams.map(team => team.score), [-500, 500]);
  assert.equal(state.resolved, true);
  assert.throws(() => game.award(state, 1), code('resolved_clue'));
  assert.throws(() => game.award(game.selectTeam(state, 'team-1'), -1), code('resolved_clue'));
});

test('score changes require a clue, selected team, and an explicit sign', () => {
  assert.throws(() => game.award(start(), 1), code('no_clue'));
  assert.throws(() => game.award(game.openClue(start(), 'film-100'), 1), code('no_team'));
  assert.throws(() => game.award(openForTeam(start()), 100), code('invalid_award'));
  assert.throws(() => game.selectTeam(start(), '__proto__'), code('unknown_team'));
});

test('revealing an answer does not score, and finishing marks the tile used', () => {
  const initial = start();
  let state = game.reveal(openForTeam(initial));
  assert.equal(state.revealed, true);
  assert.deepEqual(state.teams.map(team => team.score), [0, 0]);
  assert.equal(initial.currentClueId, null);
  state = game.finishClue(state);
  assert.deepEqual(state.completedClueIds, ['film-100']);
  assert.equal(state.currentClueId, null);
  assert.throws(() => game.openClue(state, 'film-100'), code('completed_clue'));
  state = game.undo(state);
  assert.equal(state.currentClueId, 'film-100');
  assert.equal(state.revealed, true);
  assert.deepEqual(state.completedClueIds, []);
});

test('undo after completion reopens the clue and reverses the most recent award', () => {
  let state = game.award(openForTeam(start()), -1);
  state = game.selectTeam(state, 'team-2');
  state = game.reveal(state);
  state = game.award(state, 1);
  state = game.finishClue(state);
  state = game.openClue(state, 'film-500');
  state = game.undo(state);
  assert.equal(state.currentClueId, 'film-100');
  assert.equal(state.selectedTeamId, 'team-2');
  assert.equal(state.revealed, true);
  assert.equal(state.resolved, false);
  assert.deepEqual(state.completedClueIds, []);
  assert.deepEqual(state.teams.map(team => team.score), [-100, 0]);
  assert.equal(state.attempts.length, 1);
  state = game.award(state, 1);
  assert.equal(state.teams[1].score, 100);
  state = game.undo(game.undo(state));
  assert.deepEqual(state.teams.map(team => team.score), [0, 0]);
  assert.equal(state.attempts.length, 0);
  assert.equal(game.canUndo(state), false);
});

test('finishing without scoring has its own undo boundary after previous scores', () => {
  let state = game.finishClue(game.award(openForTeam(start()), 1));
  state = game.finishClue(game.openClue(state, 'film-500'));
  assert.equal(game.isComplete(state), true);
  state = game.undo(state);
  assert.deepEqual(state.completedClueIds, ['film-100']);
  assert.equal(state.currentClueId, 'film-500');
  assert.equal(state.teams[0].score, 100);
  assert.equal(game.isComplete(state), false);
});

test('closing a clue preserves existing points and duplicate-award protection', () => {
  let state = game.award(openForTeam(start()), -1);
  state = game.cancelClue(state);
  assert.equal(state.currentClueId, null);
  assert.equal(state.completedClueIds.length, 0);
  state = game.openClue(state, 'film-100');
  assert.throws(() => game.award(state, -1), code('duplicate_award'));
  assert.equal(state.teams[0].score, -100);
  state = game.undo(state);
  assert.equal(state.currentClueId, 'film-100');
  assert.equal(state.teams[0].score, 0);
});

test('draft and incomplete clues stay unavailable and do not block board completion', () => {
  const state = start();
  assert.throws(() => game.openClue(state, 'draft-100'), code('draft_clue'));
  assert.throws(() => game.openClue(state, 'missing-200'), code('draft_clue'));
  assert.throws(() => game.openClue(state, 'unknown'), code('unknown_clue'));
  assert.equal(game.isComplete(state), false);
  let completed = game.finishClue(game.openClue(state, 'film-100'));
  completed = game.finishClue(game.openClue(completed, 'film-500'));
  assert.equal(game.isComplete(completed), true);
});

test('reload restores scores, attempts, revealed clue, and a usable undo history', () => {
  let state = game.finishClue(game.award(openForTeam(start()), 1));
  state = game.reveal(openForTeam(state, 'film-500', 'team-2'));
  state = game.award(state, -1);
  const restored = game.restore(game.serialize(state), pack());
  assert.deepEqual(restored, state);
  assert.deepEqual(game.restore(JSON.parse(JSON.stringify(state)), pack()), state);
  const reversed = game.undo(restored);
  assert.deepEqual(reversed.teams.map(team => team.score), [100, 0]);
  assert.equal(reversed.currentClueId, 'film-500');
  assert.equal(reversed.revealed, true);
});

test('reload rejects malformed, illegal, excessive, or mismatched save data', () => {
  const saved = JSON.parse(game.serialize(start()));
  assert.equal(game.restore('{broken', pack()), null);
  assert.equal(game.restore(null, pack()), null);
  assert.equal(game.restore({ ...saved, version: 99 }, pack()), null);
  assert.equal(game.restore({ ...saved, packId: 'another-party' }, pack()), null);
  assert.equal(game.restore({ ...saved, history: [{ type: 'award', sign: 1 }] }, pack()), null);
  assert.equal(game.restore({ ...saved, history: [{ type: 'open', clueId: 'film-100', value: 99999 }] }, pack()), null);
  assert.equal(game.restore({ ...saved, history: Array(5001).fill({ type: 'reveal' }) }, pack()), null);
  assert.equal(game.restore({ ...saved, teamNames: ['One', 'one'] }, pack()), null);
  const changed = pack();
  changed.categories[0].clues[0].answer = 'A corrected answer';
  assert.equal(game.restore(saved, changed), null);
});

test('saved totals and catalog values cannot override replayed scoring', () => {
  const state = game.award(openForTeam(start()), 1);
  const saved = JSON.parse(JSON.stringify(state));
  saved.teams[0].score = 1000000;
  saved.clueCatalog[0].value = 1000000;
  saved.attempts[0].value = 1000000;
  saved.undoIndex = -1;
  const restored = game.restore(saved, pack());
  assert.equal(restored.teams[0].score, 100);
  assert.equal(restored.attempts[0].value, 100);
  assert.equal(game.canUndo(restored), true);
});

test('invalid packs and duplicate IDs are rejected; special-string IDs are safe', () => {
  const duplicate = pack();
  duplicate.categories[0].clues[1].id = 'film-100';
  assert.throws(() => game.create(['One', 'Two'], duplicate), code('invalid_pack'));
  const badValue = pack();
  badValue.categories[0].clues[0].value = -100;
  assert.throws(() => game.create(['One', 'Two'], badValue), code('invalid_pack'));
  const special = pack();
  special.categories[0].clues[0].id = '__proto__';
  let state = game.create(['One', 'Two'], special);
  state = game.award(openForTeam(state, '__proto__'), 1);
  assert.equal(state.teams[0].score, 100);
  assert.equal({}.score, undefined);
});

test('transitions cannot mutate older states or their nested score records', () => {
  const before = openForTeam(start());
  const after = game.award(before, 1);
  assert.equal(before.teams[0].score, 0);
  assert.equal(before.attempts.length, 0);
  assert.equal(after.teams[0].score, 100);
  assert.throws(() => { after.teams[0].score = 9000; }, TypeError);
  assert.throws(() => { after.history.push({ type: 'award', sign: 1 }); }, TypeError);
});

test('a complete six-team, thirty-clue party can reload and undo its final result', () => {
  const fullPack = {
    id: 'full-party',
    categories: Array.from({ length: 6 }, (_, category) => ({
      id: 'category-' + category,
      clues: Array.from({ length: 5 }, (_, row) => ({
        id: 'clue-' + category + '-' + row,
        value: (row + 1) * 100,
        question: { en: 'Question', nb: 'Spørsmål' },
        answer: { en: 'Answer', nb: 'Svar' }
      }))
    }))
  };
  let state = game.create(['One', 'Two', 'Three', 'Four', 'Five', 'Six'], fullPack);
  fullPack.categories.forEach((category, index) => {
    category.clues.forEach(clue => {
      state = game.selectTeam(game.openClue(state, clue.id), 'team-' + (index + 1));
      state = game.finishClue(game.award(game.reveal(state), 1));
    });
  });
  assert.equal(state.completedClueIds.length, 30);
  assert.equal(game.isComplete(state), true);
  assert.deepEqual(state.teams.map(team => team.score), Array(6).fill(1500));
  state = game.restore(game.serialize(state), fullPack);
  assert.equal(game.isComplete(state), true);
  state = game.undo(state);
  assert.equal(state.completedClueIds.length, 29);
  assert.equal(state.currentClueId, 'clue-5-4');
  assert.equal(state.teams[5].score, 1000);
  assert.equal(game.isComplete(state), false);
});

test('category selections constrain the board and survive scoring, restore and undo', () => {
  let state = game.create(['One','Two'], pack(), ['films']);
  assert.deepEqual(state.categoryIds, ['films']);
  assert.deepEqual(state.clueCatalog.map(clue => clue.id), ['film-100','film-500']);
  assert.throws(() => game.openClue(state,'draft-100'),code('unknown_clue'));
  state = game.award(openForTeam(state),1);
  const restored = game.restore(game.serialize(state),pack());
  assert.deepEqual(restored,state);
  assert.deepEqual(game.undo(restored).categoryIds,['films']);
  const changedOutsideBoard = pack();
  changedOutsideBoard.categories[1].clues[0].answer='Unselected content changed';
  assert.deepEqual(game.restore(game.serialize(state),changedOutsideBoard),state);
});

test('unknown, empty and duplicated category choices fail without creating a game', () => {
  [[],['missing'],['films','films'],[{}]].forEach(ids => assert.throws(() => game.create(['One','Two'],pack(),ids),code('invalid_categories')));
  const duplicate = pack(); duplicate.categories[1].id='films';
  assert.throws(() => game.create(['One','Two'],duplicate),code('invalid_pack'));
});

test('manual corrections are logged, replayed and undone independently of clue awards', () => {
  let state = game.finishClue(game.award(openForTeam(start()),1));
  state = game.adjustScore(state,'team-1',-25,'Correct an earlier ruling');
  state = game.adjustScore(state,'team-2',50,'House-rule bonus');
  assert.deepEqual(state.teams.map(team => team.score),[75,50]);
  assert.equal(state.attempts.length,1);
  assert.equal(state.history.at(-1).reason,'House-rule bonus');
  state = game.restore(game.serialize(state),pack());
  state = game.undo(state);
  assert.deepEqual(state.teams.map(team => team.score),[75,0]);
  state = game.undo(state);
  assert.deepEqual(state.teams.map(team => team.score),[100,0]);
  assert.deepEqual(state.completedClueIds,['film-100']);
  state = game.undo(state);
  assert.deepEqual(state.teams.map(team => team.score),[0,0]);
  assert.equal(state.currentClueId,'film-100');
});

test('manual corrections reject missing team, invalid numbers and absent reasons', () => {
  assert.throws(() => game.adjustScore(start(),'unknown',50,'Bonus'),code('unknown_team'));
  [0,0.5,Infinity,NaN,'100',1000001,-1000001].forEach(amount => assert.throws(() => game.adjustScore(start(),'team-1',amount,'Reason'),code('invalid_adjustment')));
  ['',null,'a'.repeat(161),'line\nbreak'].forEach(reason => assert.throws(() => game.adjustScore(start(),'team-1',50,reason),code('invalid_reason')));
  const saved = JSON.parse(game.serialize(start()));
  assert.equal(game.restore({...saved,history:[{type:'adjust',teamId:'team-1',amount:1,reason:'Fine',injected:true}]},pack()),null);
});
