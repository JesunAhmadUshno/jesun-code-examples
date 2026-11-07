// Known-answer check, run by `npm run build` before vite: node src/check.mjs
// Reproduces the page's computed numbers from the repo files and fails the build on drift.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { featureLines, keywordsUsed, cheatsheet, constructTest, fibonacci, primes, diffLines, tokenizeLine } from './lang.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const names = fs.readdirSync(root).filter((f) => f.endsWith('.jc')).sort();
const src = Object.fromEntries(names.map((n) => [n, read(n)]));
const out = Object.fromEntries(names.map((n) => [n, read(`expected/${n.replace('.jc', '.out')}`)]));

// 1. Every program has a recorded output, and the README table lists exactly these programs.
const readme = read('README.md');
const table = [...readme.matchAll(/^\| `(\w+\.jc)` \| (.+) \|$/gm)].map((m) => [m[1], m[2]]);
assert.deepEqual(table.map((t) => t[0]).sort(), names, 'README table and .jc files differ');

// 2. The JS calculators reproduce the real interpreter's recorded output exactly.
const fibCount = +/repeat (\d+) times/.exec(src['fibonacci.jc'])[1];
const fib = fibonacci(fibCount);
assert.equal(fib.values.join('\n') + '\n', out['fibonacci.jc'], 'fibonacci port drifted');
const primeCount = +/is less than (\d+)/.exec(src['primes.jc'].split('\n').find((l) => l.includes('length of found')))[1];
const pr = primes(primeCount);
assert.equal(`first ten primes: [${pr.found.join(', ')}]\n`, out['primes.jc'], 'primes port drifted');
// Measured by running copies of both programs with a counter (push 1 to a list per call or
// per `n % d` test) on jesun.py @1282f9a: 453 fib calls, 44 trial divisions. 453 also equals
// the closed form: sum over i=0..10 of (2*fib(i+1) - 1).
assert.equal(fib.calls, 453);
assert.equal(pr.divisions, 44);

// 3. Each feature the README table claims for a program is found by the feature scan.
const claims = { 'Variables': 'variables', 'interpolation': 'interpolation', '`repeat`': 'loops', '`if`': 'branches',
  '`to ... with`': 'functions', 'recursion': 'recursion', 'Lists': 'lists', 'File I/O': 'fileio', '`split of`': 'split', 'Nested loops': 'loops' };
for (const [file, text] of table) {
  const f = featureLines(src[file]);
  for (const [phrase, key] of Object.entries(claims)) if (text.includes(phrase)) assert.ok(f[key].length, `${file}: README claims ${key}, scan found none`);
}
assert.deepEqual(featureLines(src['fibonacci.jc']).recursion, [6], 'recursion should be the one self-call line in fib');
for (const n of names.filter((n) => n !== 'fibonacci.jc')) assert.equal(featureLines(src[n]).recursion.length, 0, `${n} is not recursive`);

// 4. Recorded wordcount matches the text it writes (11 words on 2 lines).
const text = JSON.parse(/write ("[^"]*") to file/.exec(src['wordcount.jc'])[1]);
const words = text.split(/\s+/).filter(Boolean).length, lines = text.split('\n').filter(Boolean).length;
assert.equal(out['wordcount.jc'], `words: ${words}\nlines: ${lines}\n`);

// 5. The interpreter commit is the same everywhere it is pinned.
const commit = /commit ([0-9a-f]{7})/.exec(read('scripts/check_examples.py'))[1];
assert.ok(read('site/public/jesun.py').split('\n', 4).join('\n').includes(commit), 'vendored jesun.py commit differs');
assert.ok(read('.github/workflows/examples.yml').includes(`ref: ${commit}`), 'CI pin differs');

// 6. Cheatsheet parses, every construct appears in some example, and the highlighter round-trips.
const cs = cheatsheet(readme);
assert.ok(cs.pairs.length >= 4, 'README cheatsheet sentence not found');
for (const [c] of cs.pairs) assert.ok(names.some((n) => src[n].split('\n').some(constructTest(c))), `no example uses ${c}`);
for (const n of names) for (const l of src[n].split('\n')) assert.equal(tokenizeLine(l).map((t) => t[1]).join(''), l);
assert.ok(diffLines('a\nb\n', 'a\nc\n').map((d) => d.same).join() === 'true,false');

const kw = keywordsUsed(Object.values(src));
const totalLines = Object.values(src).reduce((s, t) => s + t.trimEnd().split('\n').length, 0);
console.log('check ok', { programs: names.length, totalLines, keywords: kw.length, commit, fibCalls: fib.calls, primeDivisions: pr.divisions });
