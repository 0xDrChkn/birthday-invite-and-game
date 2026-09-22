'use strict';
const assert = require('node:assert/strict');
const {test}=require('node:test');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const tools=require('../game/pack-tools.js');
const engine=require('../game/engine.js');
const context={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../game/pack.js'),'utf8'),context);
const bank=JSON.parse(JSON.stringify(context.window.BIRTHDAY_GAME_PACK));
const images=bank.categories.flatMap(category => category.clues.flatMap(clue => [clue.image,clue.answerImage].filter(Boolean)));
function exported(){return JSON.parse(tools.exportPack(bank));}

test('the expanded bank offers ten columns and a complete recommended thirty-clue game',() => {
  assert.equal(bank.categories.length,10);
  let state=engine.create(['One','Two'],bank,bank.defaultCategoryIds);
  assert.equal(state.clueCatalog.length,30);
  assert.equal(state.clueCatalog.filter(clue => clue.playable).length,30);
  for(const clue of state.clueCatalog){ state=engine.finishClue(engine.openClue(state,clue.id)); }
  assert.equal(engine.isComplete(state),true);
  assert.deepEqual(engine.restore(engine.serialize(state),bank),state);
});
test('an exported bank imports cleanly and keeps existing bundled picture clues',() => {
  const imported=tools.parse(tools.exportPack(bank),images);
  assert.equal(imported.categories.length,10);
  assert.equal(imported.categories.find(category => category.id==='countries').clues[0].image,bank.categories.find(category => category.id==='countries').clues[0].image);
  assert.equal(imported.reactions,undefined);
  assert.equal(engine.create(['One','Two'],imported,imported.defaultCategoryIds).clueCatalog.filter(clue => clue.playable).length,30);
});
test('private text, embedded raster images and bilingual answer variants survive import',() => {
  const data=exported();
  const clue=data.categories[0].clues[0];
  clue.question='<b>This is data, not markup</b>';
  clue.image='data:image/png;base64,aGVsbG8=';
  clue.acceptedAnswers=['Variant',{en:'English',nb:'Norsk'}];
  clue.source='Ignored source metadata';
  const actual=tools.parse(JSON.stringify(data),images).categories[0].clues[0];
  assert.equal(actual.question.en,clue.question);
  assert.equal(actual.image,clue.image);
  assert.equal(actual.acceptedAnswers[1].nb,'Norsk');
  assert.equal(actual.source,undefined);
});
test('imports reject active/external images, oversized input and malformed category layouts',() => {
  for(const image of ['https://example.com/private.jpg','file:///private/photo.jpg','javascript:alert(1)','data:image/svg+xml;base64,PHN2Zz4=','../secret.png']){
    const data=exported(); data.categories[0].clues[0].image=image;
    assert.throws(() => tools.parse(JSON.stringify(data),images));
  }
  assert.throws(() => tools.parse(' '.repeat(tools.MAX_BYTES+1)));
  assert.throws(() => tools.parse('{bad'));
  for(const change of [data => {data.categories[1].id=data.categories[0].id;},data => {data.categories[1].clues[0].id=data.categories[0].clues[0].id;},data => {data.categories[0].clues.pop();},data => {data.categories[0].clues[0].value=999;},data => {data.defaultCategoryIds=['missing'];}]){
    const data=exported(); change(data); assert.throws(() => tools.parse(JSON.stringify(data),images));
  }
});
test('imported private packs restore with identical selections and reject edited answers',() => {
  const privateBank=tools.parse(tools.exportPack(bank),images);
  let state=engine.create(['One','Two'],privateBank,privateBank.defaultCategoryIds);
  state=engine.selectTeam(engine.openClue(state,state.clueCatalog[0].id),'team-1');
  state=engine.award(state,1);
  const saved=engine.serialize(state);
  assert.deepEqual(engine.restore(saved,tools.parse(tools.exportPack(privateBank),images)),state);
  privateBank.categories[0].clues[0].answer.en='Changed';
  assert.equal(engine.restore(saved,privateBank),null);
});

test('single-language imported text stays readable in either interface language',() => {
  const data=exported(); data.categories[0].clues[0].question={nb:'Bare norsk'};
  const actual=tools.parse(JSON.stringify(data),images).categories[0].clues[0];
  assert.deepEqual(actual.question,{en:'Bare norsk',nb:'Bare norsk'});
});
