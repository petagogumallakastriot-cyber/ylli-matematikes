// Handler regression test; no browser or learner data required.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

test('units-first entry keeps each digit in its column', () => {
  let state, refs, published;
  const hooks = {
    useState(init) { state ??= init(); return [state, (value) => { state = value; }]; },
    useRef(init) { refs ??= { current: init }; return refs; },
  };
  const source = fs.readFileSync(`${__dirname}/../src/components/column-answer.tsx`, 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  new Function('require', 'exports', compiled)((id) => {
    if (id === 'react') return hooks;
    if (id === '@/lib/i18n') return { useT: () => ({ t: (key) => key }) };
    return require(id);
  }, exports);
  const { ColumnAnswer, answerPlaces } = exports;
  const render = () => ColumnAnswer({ places: 5, onChange: (value) => { published = value; } }).props.children;
  const type = (index, value) => render()[index].props.onChange({ target: { value } });
  for (const [index, digit] of [[4, '3'], [3, '7'], [2, '3'], [1, '9']]) type(index, digit);
  assert.equal(published, '9373');
  assert.deepEqual(state, ['', '9', '3', '7', '3']);
  type(2, '4');
  assert.equal(published, '9473');
  assert.equal(state[4], '3');
  type(2, '');
  assert.equal(published, ''); // A missing internal column cannot be submitted.
  const paste = (value) => render()[4].props.onPaste({
    preventDefault() {}, clipboardData: { getData: () => value },
  });
  paste('9373');
  assert.equal(published, '9373');
  paste('0');
  assert.equal(published, '0');
  paste('123456');
  assert.equal(published, '0'); // Overflow is rejected, not silently truncated.
  assert.equal(answerPlaces(8809, 564, '+'), 5);
  assert.equal(answerPlaces(12, 3, '*'), 3);
  assert.equal(answerPlaces(3, 8, '-'), null);
  assert.equal(answerPlaces(1.5, 2, '+'), null);
  assert.equal(answerPlaces(10, 2, '/'), null);
});
