// Pure helpers shared by the page and the build-time check (src/check.mjs).
// Everything here is computed from the .jc sources and expected/*.out text.

// Words of the language the highlighter and the keyword count know about.
// Multi-word phrases come first so "give back" wins over "give".
export const KEYWORDS = [
  'otherwise if', 'give back', 'for each', 'length of', 'split of', 'read file', 'to file',
  'at most', 'at least', 'less than', 'greater than', 'is not',
  'note', 'show', 'is', 'to', 'with', 'repeat', 'times', 'while', 'in', 'if', 'then',
  'otherwise', 'push', 'by', 'giving', 'write', 'and', 'or', 'not', 'true', 'false', 'nothing',
];
const KW_RE = new RegExp(`\\b(${KEYWORDS.map((k) => k.replace(/ /g, '\\s+')).join('|')})\\b`, 'g');

// Splits one line into [kind, text] tokens: comment, string (with {interp}), keyword, number, plain.
export function tokenizeLine(line) {
  const out = [];
  if (/^\s*note\b/.test(line)) {
    const i = line.indexOf('note');
    if (i) out.push(['plain', line.slice(0, i)]);
    out.push(['comment', line.slice(i)]);
    return out;
  }
  let rest = line;
  while (rest) {
    const q = rest.indexOf('"');
    const code = q < 0 ? rest : rest.slice(0, q);
    pushCode(out, code);
    if (q < 0) break;
    const end = rest.indexOf('"', q + 1);
    const str = end < 0 ? rest.slice(q) : rest.slice(q, end + 1);
    for (const part of str.split(/(\{[^}]*\})/)) if (part) out.push([part.startsWith('{') ? 'interp' : 'string', part]);
    rest = end < 0 ? '' : rest.slice(end + 1);
  }
  return out;
}
function pushCode(out, code) {
  let last = 0;
  for (const m of code.matchAll(new RegExp(`${KW_RE.source}|\\b\\d+\\b`, 'g'))) {
    if (m.index > last) out.push(['plain', code.slice(last, m.index)]);
    out.push([/\d/.test(m[0][0]) ? 'number' : 'keyword', m[0]]);
    last = m.index + m[0].length;
  }
  if (last < code.length) out.push(['plain', code.slice(last)]);
}

// Code with strings and comments removed, for keyword and feature scans.
export const codeOnly = (line) => (/^\s*note\b/.test(line) ? '' : line.replace(/"(?:[^"\\]|\\.)*"/g, '""'));

export function keywordsUsed(sources) {
  const used = new Set();
  for (const src of sources) for (const line of src.split('\n')) {
    if (/^\s*note\b/.test(line)) used.add('note');
    for (const m of codeOnly(line).matchAll(KW_RE)) used.add(m[0].replace(/\s+/g, ' '));
  }
  return [...used].sort();
}

// Language features, each a test on one source line. Recursion is handled separately.
export const FEATURES = [
  ['variables', 'Variables', (l) => /^\s*[A-Za-z_]\w*\s+is\s/.test(codeOnly(l))],
  ['interpolation', 'Interpolation', (l) => /"[^"]*\{[^}]+\}[^"]*"/.test(l) && !/^\s*note\b/.test(l)],
  ['loops', 'Loops', (l) => /^\s*(repeat|for each)\b/.test(codeOnly(l))],
  ['branches', 'Branches', (l) => /^\s*(if|otherwise)\b/.test(codeOnly(l))],
  ['functions', 'Functions', (l) => /^\s*to\s+\w+|\bgive back\b/.test(codeOnly(l))],
  ['recursion', 'Recursion', null],
  ['lists', 'Lists', (l) => /\[|\bpush\b|\blength of\b|\bfor each\b/.test(codeOnly(l))],
  ['fileio', 'File I/O', (l) => /\bto file\b|\bread file\b/.test(codeOnly(l))],
  ['split', 'String split', (l) => /\bsplit of\b/.test(codeOnly(l))],
];

// Lines (1-based) inside a function body that call that same function.
function recursiveLines(lines) {
  const hits = [];
  lines.forEach((line, i) => {
    const m = /^(\s*)to\s+(\w+)/.exec(line);
    if (!m) return;
    const indent = m[1].length, name = m[2];
    for (let j = i + 1; j < lines.length; j++) {
      const body = lines[j];
      if (body.trim() && body.search(/\S/) <= indent) break;
      if (new RegExp(`\\b${name}\\s+with\\b`).test(codeOnly(body))) hits.push(j + 1);
    }
  });
  return hits;
}

// { featureKey: [line numbers] } for one program.
export function featureLines(src) {
  const lines = src.split('\n');
  const out = {};
  for (const [key, , test] of FEATURES) {
    out[key] = key === 'recursion' ? recursiveLines(lines) : lines.flatMap((l, i) => (test(l) ? [i + 1] : []));
  }
  return out;
}

// The README's "`is` assigns. `show` prints." sentence, as [construct, meaning] pairs.
export function cheatsheet(readme) {
  const block = /## The language in 30 seconds[\s\S]*?```[^\n]*\n([\s\S]*?)```\s*\n([\s\S]*?)\n\n/.exec(readme);
  if (!block) return { sample: '', pairs: [] };
  const pairs = [...block[2].replace(/\n/g, ' ').matchAll(/`([^`]+)`\s+([^.`]+)\./g)].map((m) => [m[1], m[2].trim()]);
  return { sample: block[1].trimEnd(), pairs };
}
// Line test for a README construct such as "to ... with" or "give back".
export function constructTest(construct) {
  if (construct.includes('...')) {
    const [a, b] = construct.split('...').map((s) => s.trim());
    return (l) => new RegExp(`^\\s*${a}\\s+\\w+.*\\b${b}\\b`).test(codeOnly(l));
  }
  if (construct === 'is') return FEATURES[0][2];
  return (l) => new RegExp(`\\b${construct.replace(/ /g, '\\s+')}\\b`).test(codeOnly(l));
}

// Line-by-line comparison of live output against the recorded output.
export function diffLines(want, got) {
  const a = want.replace(/\n$/, '').split('\n'), b = got.replace(/\n$/, '').split('\n');
  return Array.from({ length: Math.max(a.length, b.length) }, (_, i) => ({ want: a[i], got: b[i], same: a[i] === b[i] }));
}

// JS ports of fibonacci.jc and primes.jc, checked against expected/*.out at build time.
export function fibonacci(count) {
  let calls = 0;
  const fib = (n) => { calls++; return n <= 1 ? n : fib(n - 1) + fib(n - 2); };
  const values = [];
  for (let i = 0; i < count; i++) values.push(fib(i));
  return { values, calls };
}
export function primes(count) {
  let divisions = 0;
  const isPrime = (n) => {
    if (n < 2) return false;
    for (let d = 2; d * d <= n; d++) { divisions++; if (n % d === 0) return false; }
    return true;
  };
  const found = [];
  for (let n = 2; found.length < count; n++) if (isPrime(n)) found.push(n);
  return { found, divisions };
}
