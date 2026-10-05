// Run: node tests/chat-language-check.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../js/chat.js'), 'utf8');
for (const [search, saved, expected] of [
  ['?lang=en', 'zh', 'Ask the workshop'],
  ['?lang=zh', 'en', '询盘助手'],
  ['', 'zh', '询盘助手'],
  ['', 'en', 'Ask the workshop'],
  ['?lang=unknown', 'zh', '询盘助手']
]) {
  let actual;
  const stop = {};
  const node = { set textContent(value) { actual = value; throw stop; } };
  try {
    vm.runInNewContext(source, {
      location: { search }, URLSearchParams,
      localStorage: { getItem: () => saved },
      document: {
        getElementById: () => null,
        createElement: () => ({ querySelector: () => node }),
        head: { appendChild() {} }, body: { appendChild() {} }
      }
    });
  } catch (error) { if (error !== stop) throw error; }
  assert.equal(actual, expected, `${search} with saved ${saved}`);
}
console.log('Chat language check passed: explicit language overrides saved preference; saved preference remains the fallback.');
