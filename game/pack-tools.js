(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.BirthdayGamePackTools = api;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';
  const MAX_BYTES = 2000000;
  const record = value => value && typeof value === 'object' && !Array.isArray(value);
  const bad = message => { throw new Error(message); };
  const id = value => typeof value === 'string' && /^[a-z0-9][a-z0-9_-]{0,79}$/i.test(value);
  function text(value, required = false) {
    if (typeof value === 'string') value = { en: value, nb: value };
    if (!record(value)) { if (required) bad('A title, question or answer is missing.'); return undefined; }
    const result = {};
    ['en','nb'].forEach(lang => {
      if (value[lang] !== undefined) {
        if (typeof value[lang] !== 'string' || value[lang].length > 5000) bad('Text must be no longer than 5,000 characters.');
        result[lang] = value[lang];
      }
    });
    if (required && !Object.values(result).some(part => part.trim())) bad('A title, question or answer is empty.');
    if (!result.en?.trim() && result.nb?.trim()) result.en = result.nb;
    if (!result.nb?.trim() && result.en?.trim()) result.nb = result.en;
    return result;
  }
  function image(value, trustedImages) {
    if (value === undefined || value === '') return undefined;
    if (typeof value !== 'string') bad('An image must be an embedded PNG, JPG or WebP.');
    if (trustedImages.includes(value)) return value;
    if (/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(value)) return value;
    bad('Embed private images as PNG, JPG or WebP data URLs. External URLs and file paths are not loaded.');
  }
  function parse(raw, trustedImages = []) {
    if (typeof raw !== 'string' || raw.length > MAX_BYTES) bad('Choose a JSON pack smaller than 2 MB.');
    let source;
    try { source = JSON.parse(raw); } catch { bad('This file is not valid JSON.'); }
    if (!record(source) || !id(source.id) || !Array.isArray(source.categories) || source.categories.length < 6 || source.categories.length > 12) bad('A pack needs an ID and 6–12 categories.');
    const seenCategories = new Set();
    const seenClues = new Set();
    const categories = source.categories.map(category => {
      if (!record(category) || !id(category.id) || seenCategories.has(category.id) || !Array.isArray(category.clues) || category.clues.length !== 5) bad('Each category needs a unique ID and five clues.');
      seenCategories.add(category.id);
      const clues = category.clues.map((clue,index) => {
        if (!record(clue) || !id(clue.id) || seenClues.has(clue.id) || clue.value !== (index+1)*100) bad('Clues need unique IDs and values of 100, 200, 300, 400 and 500 in order.');
        seenClues.add(clue.id);
        if (clue.draft !== undefined && typeof clue.draft !== 'boolean') bad('Draft must be true or false.');
        const result = { id:clue.id, value:clue.value, question:text(clue.question,true), answer:text(clue.answer,!clue.draft) };
        if (clue.draft) result.draft = true;
        ['image','answerImage'].forEach(key => { const value=image(clue[key],trustedImages); if(value) result[key]=value; });
        ['imageAlt','explanation','hostNote','hint'].forEach(key => { const value=text(clue[key]); if(value) result[key]=value; });
        if (clue.acceptedAnswers !== undefined) {
          if (!Array.isArray(clue.acceptedAnswers) || clue.acceptedAnswers.length > 20) bad('Accepted answers must be a list of up to 20 entries.');
          result.acceptedAnswers = clue.acceptedAnswers.map(value => text(value,true));
        }
        return result;
      });
      return { id:category.id, title:text(category.title,true), description:text(category.description), clues };
    });
    const defaults = source.defaultCategoryIds || categories.slice(0,6).map(category => category.id);
    if (!Array.isArray(defaults) || defaults.length !== 6 || new Set(defaults).size !== 6 || defaults.some(value => !seenCategories.has(value))) bad('Choose six distinct default category IDs from the pack.');
    return { id:source.id, title:text(source.title), categories, defaultCategoryIds:defaults.slice() };
  }
  function exportPack(pack) {
    const {reactions,...content} = pack;
    return JSON.stringify(content,null,2);
  }
  return Object.freeze({ MAX_BYTES, parse, exportPack });
});
