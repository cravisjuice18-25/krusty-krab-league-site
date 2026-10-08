const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const ctx = vm.createContext({});
vm.runInContext(fs.readFileSync('data-loader.js', 'utf8'), ctx);
const parse = input => JSON.parse(JSON.stringify(ctx.parseCSV(input)));
test('empty and BOM-only files produce no rows', () => {
 assert.deepEqual(parse(''), []);
 assert.deepEqual(parse('\uFEFF'), []);
});
test('quoted commas, CRLF, escaped quotes, and embedded newlines survive parsing', () => {
 assert.deepEqual(parse('\uFEFFname,notes\r\n"A, B","two\nlines"\r\n"A ""quote""",ok'), [
  {name:'A, B',notes:'two\nlines'}, {name:'A "quote"',notes:'ok'}
 ]);
});
test('malformed quoted data is rejected', () => {
 assert.throws(() => parse('name,value\n"unfinished,2'), /unclosed/);
});
