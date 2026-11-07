import { useMemo, useState, useEffect, useRef, useCallback, useId } from 'react';
import readme from '../../README.md?raw';
import checker from '../../scripts/check_examples.py?raw';
import { FEATURES, KEYWORDS, featureLines, keywordsUsed, tokenizeLine, cheatsheet, constructTest, diffLines, fibonacci, primes } from './lang.js';

const REPO = 'https://github.com/JesunAhmadUshno/jesun-code-examples';
const LANG_REPO = 'https://github.com/JesunAhmadUshno/jesun-code';
const blob = (p) => `${REPO}/blob/main/${p}`;
const COMMIT = /commit ([0-9a-f]{7})/.exec(checker)[1];

// Every program, its source and its recorded output, read from the repo at build time.
const srcMods = import.meta.glob('../../*.jc', { query: '?raw', import: 'default', eager: true });
const outMods = import.meta.glob('../../expected/*.out', { query: '?raw', import: 'default', eager: true });
const byName = (mods) => Object.fromEntries(Object.entries(mods).map(([k, v]) => [k.split('/').pop().replace(/\.\w+$/, ''), v]));
const SRC = byName(srcMods), OUT = byName(outMods);
// Order and one-line descriptions come from the README table.
const PROGRAMS = [...readme.matchAll(/^\| `(\w+)\.jc` \| (.+) \|$/gm)].map((m) => ({ name: m[1], what: m[2].replace(/`/g, '') }));
const FEAT = Object.fromEntries(PROGRAMS.map((p) => [p.name, featureLines(SRC[p.name])]));
const KW = keywordsUsed(Object.values(SRC));
const TOTAL_LINES = Object.values(SRC).reduce((s, t) => s + t.trimEnd().split('\n').length, 0);
const CODE_LINES = Object.values(SRC).reduce((s, t) => s + t.split('\n').filter((l) => l.trim() && !/^\s*note\b/.test(l)).length, 0);
const CHEAT = cheatsheet(readme);
const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
const cap = (s) => s[0].toUpperCase() + s.slice(1);

const SECTIONS = [['top', 'Overview', '◎'], ['examples', 'Examples', '❯_'], ['features', 'Features', '▦'], ['cheatsheet', 'Cheatsheet', '≡'], ['calc', 'Calculators', '∑'], ['verify', 'Verify', '✓'], ['notes', 'Limits', '!']];

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('in')); return; }
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.08 });
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, []);
}

function MenuBar() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(t); }, []);
  return (
    <div className="menubar" role="banner">
      <span className="apple" aria-hidden="true">◆</span>
      <a className="app" href="#top">Jesun.Code Examples</a>
      <a className="m" href={blob('README.md')}>README</a>
      <a className="m" href={blob('scripts/check_examples.py')}>Check script</a>
      <a className="m" href={LANG_REPO}>The language</a>
      <span className="spacer" />
      <span className="status"><i /> {Object.keys(OUT).length}/{PROGRAMS.length} outputs recorded</span>
      <a href={REPO}>GitHub ↗</a>
      <span className="clock">{now.toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' })}</span>
    </div>
  );
}

function Dock() {
  const [active, setActive] = useState('top');
  useEffect(() => {
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setActive(e.target.id)), { rootMargin: '-45% 0px -50% 0px' });
    SECTIONS.forEach(([id]) => { const el = document.getElementById(id); if (el) io.observe(el); });
    return () => io.disconnect();
  }, []);
  return (
    <nav className="dock" aria-label="Sections">
      {SECTIONS.map(([id, label, icon]) => (
        <a key={id} href={`#${id}`} className={active === id ? 'on' : ''} aria-current={active === id ? 'true' : undefined}>
          <span className="ico" aria-hidden="true">{icon}</span><span className="lbl">{label}</span>
        </a>
      ))}
    </nav>
  );
}

function Range({ label, value, min, max, step, onChange, show }) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label} <span>{show}</span></label>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} />
    </div>
  );
}

export default function App() {
  useReveal();
  const [prog, setProg] = useState(PROGRAMS[0].name);
  const [mark, setMark] = useState({ lines: [], label: '' });
  // Called from the matrix and the cheatsheet: open a program with some lines lit up.
  const show = useCallback((name, lines, label) => {
    setProg(name);
    setMark({ lines, label });
    document.getElementById('examples')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);
  return (
    <div className="wrap">
      <MenuBar />
      <div className="glow" aria-hidden="true" />
      <Hero />
      <Examples prog={prog} setProg={(p) => { setProg(p); setMark({ lines: [], label: '' }); }} mark={mark} />
      <Features show={show} />
      <Cheatsheet show={show} />
      <Calculators />
      <Verify />
      <Notes />
      <Dock />
      <footer>
        Programs and README: MIT. Interpreter: <a href={LANG_REPO} style={{ color: 'inherit' }}>jesun-code</a> @{COMMIT}, MIT.
        Every number on this page is computed at build time from the <code>.jc</code> files, <code>expected/*.out</code> and the README, or live in your browser.
      </footer>
    </div>
  );
}

function Hero() {
  return (
    <header className="card hero window" id="top" data-title="jesun-code-examples — README">
      <div className="head">
        <p className="eyebrow">Example programs · recorded and re-checkable</p>
        <span className="pill good">● {Object.keys(OUT).length}/{PROGRAMS.length} outputs recorded</span>
      </div>
      <h1>{cap(WORDS[PROGRAMS.length])} programs that read like <em>plain English</em>, each run on the real interpreter.</h1>
      <p className="sub">
        Jesun.Code is a small language where <code>is</code> assigns, <code>show</code> prints and <code>give back</code> returns.
        These are its starter programs, from Hello to primes. Each one sits next to the output the real interpreter printed, and a check script plus CI rerun them on every push.
        Edit any program below and run it in your browser on the same interpreter.
      </p>
      <div className="actions">
        <a className="btn primary" href="#examples">Open the examples</a>
        <a className="btn ghost" href={LANG_REPO}>About the language</a>
        <span className="hint">Verify locally with <code>python3 scripts/check_examples.py</code></span>
      </div>
      <div className="tiles">
        <div className="tile"><div className="num">{PROGRAMS.length}</div><div className="cap">programs, each with a recorded output file</div></div>
        <div className="tile"><div className="num">{TOTAL_LINES}</div><div className="cap">source lines in total, {CODE_LINES} of them code (not comments or blanks)</div></div>
        <div className="tile"><div className="num">{KW.length}</div><div className="cap">distinct language words used, of the {KEYWORDS.length} the highlighter knows</div></div>
        <div className="tile"><div className="num mono-num">{COMMIT}</div><div className="cap">interpreter commit every output was recorded on</div></div>
      </div>
    </header>
  );
}

function Code({ text, marked = [] }) {
  const set = new Set(marked);
  return (
    <pre className="code" tabIndex={0} aria-label="Program source">
      {text.replace(/\n$/, '').split('\n').map((line, i) => (
        <span key={i} className={`ln${set.has(i + 1) ? ' lit' : ''}`}>
          <span className="no" aria-hidden="true">{i + 1}</span>
          {tokenizeLine(line).map(([k, t], j) => (k === 'plain' ? t : <span key={j} className={`t-${k}`}>{t}</span>))}
          {'\n'}
        </span>
      ))}
    </pre>
  );
}

// One Pyodide worker for the whole page, created on the first "Run live" press.
// The 10-second limit starts once the interpreter is loaded, not while Pyodide downloads.
function useRunner() {
  const worker = useRef(null), job = useRef(null);
  const [state, setState] = useState('idle'); // idle | loading | ready | running
  const finish = (how, value, next) => {
    const j = job.current; job.current = null;
    if (j) { clearTimeout(j.timer); j[how](value); }
    setState(next);
  };
  const kill = () => { worker.current?.terminate(); worker.current = null; };
  const arm = () => {
    const j = job.current;
    if (!j || j.timer) return;
    setState('running');
    j.timer = setTimeout(() => { kill(); finish('reject', new Error('Stopped after 10 seconds. An endless loop? The runner was reset.'), 'idle'); }, 10000);
  };
  const run = useCallback((source) => new Promise((resolve, reject) => {
    let w = worker.current;
    if (!w) {
      w = worker.current = new Worker(`${import.meta.env.BASE_URL}runner.js`);
      w.onmessage = ({ data }) => {
        if (data.type === 'ready') { w.ready = true; if (job.current) arm(); else setState('ready'); }
        else if (data.type === 'result') finish('resolve', data.out, 'ready');
        else { kill(); finish('reject', new Error(data.error), 'idle'); }
      };
      w.onerror = (e) => { e.preventDefault(); kill(); finish('reject', new Error('The runner could not start. Offline, or is jsDelivr blocked?'), 'idle'); };
      setState('loading');
    }
    job.current = { resolve, reject, timer: null };
    if (w.ready) arm();
    w.postMessage({ source });
  }), []); // eslint-disable-line react-hooks/exhaustive-deps
  return { state, run };
}

function Examples({ prog, setProg, mark }) {
  const original = SRC[prog], recorded = OUT[prog];
  const [edits, setEdits] = useState({});
  const [editing, setEditing] = useState(false);
  const [live, setLive] = useState({});
  const source = edits[prog] ?? original;
  const recLines = recorded.replace(/\n$/, '').split('\n');
  const [step, setStep] = useState(recLines.length);
  useEffect(() => { setStep(OUT[prog].replace(/\n$/, '').split('\n').length); }, [prog]);
  const runner = useRunner();
  const result = live[prog];
  const busy = runner.state === 'loading' || runner.state === 'running';
  const runLive = async () => {
    setLive((l) => ({ ...l, [prog]: { pending: true, source } }));
    try {
      const out = await runner.run(source);
      setLive((l) => ({ ...l, [prog]: { out, source } }));
    } catch (e) {
      setLive((l) => ({ ...l, [prog]: { err: e.message, source } }));
    }
  };
  const diff = result?.out != null ? diffLines(recorded, result.out) : null;
  const allSame = diff?.every((d) => d.same);
  const meta = PROGRAMS.find((p) => p.name === prog);
  return (
    <section id="examples" className="card window reveal" data-title={`examples.app — ${prog}.jc`}>
      <div className="head">
        <div>
          <p className="eyebrow">Source beside output</p>
          <h2>Pick a program. Read it, step through what it printed, then run it yourself.</h2>
          <p className="sub">{meta.what}.</p>
        </div>
      </div>
      <div className="tabs" role="group" aria-label="Choose a program">
        {PROGRAMS.map((p) => <button key={p.name} aria-pressed={p.name === prog} onClick={() => setProg(p.name)}>{p.name}.jc</button>)}
      </div>
      <div className="grid2 ex">
        <div className="pane">
          <div className="pane-head">
            <h3>{prog}.jc {source !== original && <span className="pill warn">edited</span>}</h3>
            <div className="seg" role="group" aria-label="Source view">
              <button aria-pressed={!editing} onClick={() => setEditing(false)}>Read</button>
              <button aria-pressed={editing} onClick={() => setEditing(true)}>Edit</button>
            </div>
          </div>
          {editing
            ? <textarea className="code edit" aria-label={`Edit ${prog}.jc`} spellCheck={false} value={source} rows={Math.max(12, source.split('\n').length + 1)} onChange={(e) => setEdits((x) => ({ ...x, [prog]: e.target.value }))} />
            : <Code text={source} marked={source === original ? mark.lines : []} />}
          <div className="tip">
            {mark.lines.length && source === original ? <>Highlighted: {mark.label} (line{mark.lines.length > 1 ? 's' : ''} {mark.lines.join(', ')})</> : 'Use the feature grid or cheatsheet below to highlight lines.'}
            {source !== original && <> <button className="link" onClick={() => setEdits((x) => ({ ...x, [prog]: undefined }))}>Reset to the original</button></>}
          </div>
        </div>
        <div className="pane">
          <div className="pane-head">
            <h3>output.log</h3>
            <span className="pill info">recorded · jesun.py @{COMMIT}</span>
          </div>
          <Range label="Step through the recorded output" value={step} min={0} max={recLines.length} step={1} onChange={setStep} show={`${step} of ${recLines.length} lines`} />
          <pre className="code out" tabIndex={0} aria-label="Recorded output">
            {recLines.slice(0, step).map((l, i) => <span key={i} className="ln"><span className="no" aria-hidden="true">{i + 1}</span>{l}{'\n'}</span>)}
            {step === 0 && <span className="muted">(nothing shown yet)</span>}
          </pre>
          <div className="actions" style={{ marginTop: 12 }}>
            <button className="btn primary" onClick={runLive} disabled={busy}>
              {runner.state === 'loading' ? 'Loading the interpreter…' : runner.state === 'running' ? 'Running…' : 'Run live in your browser'}
            </button>
            <span className="hint">The first run downloads the Pyodide runtime from jsDelivr; nothing loads until you press it.</span>
          </div>
          {result && (
            <div className="live" aria-live="polite">
              {result.pending && <p className="hint">Starting… {runner.state === 'loading' && 'fetching Pyodide and jesun.py.'}</p>}
              {result.err && <p className="pill bad wrap-pill">{result.err}</p>}
              {diff && (
                <>
                  <div className="pane-head" style={{ marginTop: 4 }}>
                    <h3>Live output vs recorded</h3>
                    <span className={`pill ${allSame ? 'good' : 'bad'}`}>{allSame ? '✓ identical' : `${diff.filter((d) => !d.same).length} line(s) differ`}</span>
                  </div>
                  <pre className="code out" tabIndex={0} aria-label="Live output compared with recorded output">
                    {diff.map((d, i) => d.same
                      ? <span key={i} className="ln same"><span className="no" aria-hidden="true">{i + 1}</span>{d.got}{'\n'}</span>
                      : <span key={i}>
                          {d.want !== undefined && <span className="ln del"><span className="no" aria-hidden="true">−</span>{d.want}{'\n'}</span>}
                          {d.got !== undefined && <span className="ln add"><span className="no" aria-hidden="true">+</span>{d.got}{'\n'}</span>}
                        </span>)}
                  </pre>
                  <p className="hint">{result.source !== original ? 'You edited the program, so differences are expected.' : 'Unedited program: this should match the recording.'} Green lines match; red is recorded, blue is live.</p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Features({ show }) {
  const [hover, setHover] = useState(null);
  const totals = FEATURES.map(([k]) => PROGRAMS.filter((p) => FEAT[p.name][k].length).length);
  return (
    <section id="features" className="card window reveal" data-title="features.matrix — scanned from the sources">
      <p className="eyebrow">Feature coverage</p>
      <h2>Which program shows which part of the language.</h2>
      <p className="sub">
        Each cell counts the source lines that use a feature, found by a keyword scan of the <code>.jc</code> files at build time.
        Click a number to open that program with those lines highlighted. The build fails if the scan misses a feature the README table claims.
      </p>
      <div className="scroll-x" style={{ overflowX: 'auto', marginTop: 16 }}>
        <table className="matrix">
          <thead><tr><th>Program</th>{FEATURES.map(([k, label]) => <th key={k}>{label}</th>)}</tr></thead>
          <tbody>
            {PROGRAMS.map((p) => (
              <tr key={p.name}>
                <td className="mono">{p.name}.jc</td>
                {FEATURES.map(([k, label]) => {
                  const lines = FEAT[p.name][k];
                  return (
                    <td key={k}>
                      {lines.length
                        ? <button className="cell" onClick={() => show(p.name, lines, label.toLowerCase())} onMouseEnter={() => setHover({ p: p.name, label, lines })} onFocus={() => setHover({ p: p.name, label, lines })} aria-label={`${label} in ${p.name}.jc: ${lines.length} line${lines.length > 1 ? 's' : ''}`}>{lines.length}</button>
                        : <span className="dash" aria-label="not used">·</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr className="total"><td>Programs using it</td>{totals.map((t, i) => <td key={i}>{t}/{PROGRAMS.length}</td>)}</tr>
          </tbody>
        </table>
      </div>
      <div className="tip" aria-live="polite">{hover ? <>{hover.label} in <span className="mono">{hover.p}.jc</span>: line{hover.lines.length > 1 ? 's' : ''} {hover.lines.join(', ')}</> : 'Hover or focus a cell to see its line numbers.'}</div>
    </section>
  );
}

function Cheatsheet({ show }) {
  return (
    <section id="cheatsheet" className="card window reveal" data-title="language.cheatsheet — from the README">
      <p className="eyebrow">The language in 30 seconds</p>
      <h2>{cap(WORDS[CHEAT.pairs.length] ?? String(CHEAT.pairs.length))} words carry most of the language.</h2>
      <p className="sub">The sample and the one-line rules below are read straight from the README. Each rule links to the example lines that use it.</p>
      <div className="grid2" style={{ marginTop: 16 }}>
        <Code text={CHEAT.sample} />
        <div className="rules">
          {CHEAT.pairs.map(([c, meaning]) => {
            const test = constructTest(c);
            const uses = PROGRAMS.map((p) => ({ name: p.name, lines: SRC[p.name].split('\n').flatMap((l, i) => (test(l) ? [i + 1] : [])) })).filter((u) => u.lines.length);
            return (
              <div className="tile" key={c}>
                <h3><code>{c}</code> {meaning}</h3>
                <div className="chips">
                  {uses.map((u) => <button key={u.name} className="chip" onClick={() => show(u.name, u.lines, `“${c}”`)}>{u.name}<b>{u.lines.length}</b></button>)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Spark({ values, label, mark }) {
  const W = 460, H = 150, pad = { l: 8, r: 8, t: 10, b: 20 };
  const max = Math.max(...values, 1);
  const bw = (W - pad.l - pad.r) / values.length;
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
      <line className="axis" x1={pad.l} x2={W - pad.r} y1={H - pad.b} y2={H - pad.b} />
      {values.map((v, i) => {
        const h = (Math.log10(v + 1) / Math.log10(max + 1)) * (H - pad.t - pad.b);
        return <rect key={i} x={pad.l + i * bw + bw * 0.12} width={Math.max(1, bw * 0.76)} y={H - pad.b - h} height={h} rx={Math.min(3, bw / 4)} fill={i < mark ? 'var(--primary)' : 'var(--muted)'} opacity={i < mark ? 0.85 : 0.35} />;
      })}
      <text x={pad.l} y={H - 4}>1</text><text x={W - pad.r} y={H - 4} textAnchor="end">{values.length} (log scale)</text>
    </svg>
  );
}

function Calculators() {
  const progFib = +/repeat (\d+) times/.exec(SRC.fibonacci)[1];
  const progPrimes = +/is less than (\d+)/.exec(SRC.primes.split('\n').find((l) => l.includes('length of found')))[1];
  const [n, setN] = useState(progFib);
  const [k, setK] = useState(progPrimes);
  const fib = useMemo(() => fibonacci(n), [n]);
  const pr = useMemo(() => primes(k), [k]);
  const perTerm = useMemo(() => Array.from({ length: 25 }, (_, i) => fibonacci(i + 1).calls - fibonacci(i).calls), []);
  const perPrime = useMemo(() => Array.from({ length: 60 }, (_, i) => primes(i + 1).divisions - primes(i).divisions), []);
  const fibMatch = n === progFib && fib.values.join('\n') + '\n' === OUT.fibonacci;
  const prMatch = k === progPrimes && `first ten primes: [${pr.found.join(', ')}]\n` === OUT.primes;
  return (
    <section id="calc" className="card window reveal" data-title="calculators — fibonacci.jc · primes.jc ported to JS">
      <p className="eyebrow">Live calculators</p>
      <h2>What the recursive and nested-loop programs actually cost.</h2>
      <p className="sub">
        JavaScript ports of <code>fibonacci.jc</code> and <code>primes.jc</code>, run as you drag. The build fails unless both ports reproduce the recorded output exactly,
        and their work counts match copies of the programs instrumented with a counter on the real interpreter.
      </p>
      <div className="grid2" style={{ marginTop: 16 }}>
        <div className="tile calc">
          <div className="pane-head"><h3>Naive recursive Fibonacci</h3>{fibMatch && <span className="pill good">matches recorded output</span>}</div>
          <Range label="Terms to print" value={n} min={1} max={25} step={1} onChange={setN} show={n} />
          <div className="big"><span className="num">{fib.calls.toLocaleString('en-US')}</span> calls to <code>fib</code> to print {n} term{n > 1 ? 's' : ''}</div>
          <p className="hint seq">{fib.values.join(', ')}</p>
          <Spark values={perTerm} mark={n} label="Calls to fib needed for each extra term, log scale" />
          <p className="hint">Calls per extra term grow like the sequence itself. The program as written prints {progFib} terms.</p>
        </div>
        <div className="tile calc">
          <div className="pane-head"><h3>Trial-division primes</h3>{prMatch && <span className="pill good">matches recorded output</span>}</div>
          <Range label="Primes to find" value={k} min={1} max={60} step={1} onChange={setK} show={k} />
          <div className="big"><span className="num">{pr.divisions.toLocaleString('en-US')}</span> <code>n % d</code> tests to find {k} prime{k > 1 ? 's' : ''}</div>
          <p className="hint seq">{pr.found.join(', ')}</p>
          <Spark values={perPrime} mark={k} label="Trial divisions spent per prime found, log scale" />
          <p className="hint">Each candidate is tested only up to its square root. The program as written finds {progPrimes}.</p>
        </div>
      </div>
    </section>
  );
}

function Verify() {
  return (
    <section id="verify" className="card window reveal" data-title="Terminal — verify.sh">
      <p className="eyebrow">How it is verified</p>
      <h2>Run every program, diff against the recording, fail on any byte.</h2>
      <ol className="steps" style={{ marginTop: 16 }}>
        <li><span className="n">1</span><div><b>Get the interpreter at the pinned commit</b><div className="hint"><code>git clone {LANG_REPO}.git && git -C jesun-code checkout {COMMIT}</code></div></div></li>
        <li><span className="n">2</span><div><b>Run the check</b><div className="hint"><code>JESUN_CODE=jesun-code/jesun.py python3 scripts/check_examples.py</code></div></div></li>
        <li><span className="n">3</span><div><b>Read the result</b><div className="hint">Each program runs in a temporary directory. Its output must equal <code>expected/&lt;name&gt;.out</code>, or the script prints a diff and exits non-zero. <code>--record</code> rewrites the recordings from the interpreter; they are never typed by hand.</div></div></li>
        <li><span className="n">4</span><div><b>CI does the same on every push</b><div className="hint"><a href={blob('.github/workflows/examples.yml')}>examples.yml</a> checks out jesun-code at {COMMIT} and runs the check. Results: <a href={`${REPO}/actions`}>GitHub Actions</a>.</div></div></li>
      </ol>
      <div className="docs" style={{ marginTop: 20 }}>
        {[['scripts/check_examples.py', 'Check script', `Python stdlib only, ${checker.trimEnd().split('\n').length} lines`], ['expected', 'Recorded outputs', `${Object.keys(OUT).length} files, one per program`], ['docs/research-review.md', 'Review', 'Graded rigor, gaps and fixes']].map(([p, t, d]) => <a key={p} href={p === 'expected' ? `${REPO}/tree/main/expected` : blob(p)}><b>{t}</b><small>{d}</small></a>)}
      </div>
    </section>
  );
}

function Notes() {
  const text = JSON.parse(/write ("[^"]*") to file/.exec(SRC.wordcount)[1]);
  const naiveWords = text.split(' ').length, naiveLines = text.split('\n').length;
  const notes = [
    ['The interpreter lives in another repo', `Outputs are recorded and checked only against jesun-code @${COMMIT}. A later language change could break an example; CI will catch it only when the pin is moved on purpose.`],
    ['wordcount.jc was wrong, and is fixed here', `Splitting the whole text on one space counted ${naiveWords} "words", and splitting on newlines counted ${naiveLines} "lines" (the empty piece after the trailing newline). It now splits lines, then words, and skips empty pieces. Its recording was redone from the interpreter.`],
    ['The live runner is the real interpreter, within limits', 'It runs the same jesun.py in Pyodide. Features that need threads, subprocesses or a network server (fleets, serve) will not work in a browser tab, and runs stop after 10 seconds.'],
    ['The feature grid is a keyword scan, not a parser', 'It tags lines by regular expressions over the source. It is checked against the README table, but an unusual line could be tagged wrongly.'],
    ['"Reads like plain English" is a claim, not a measurement', 'Nothing here tests whether newcomers read these programs faster than Python. There is no learner study and no side-by-side comparison.'],
    ['Thin coverage', 'No example covers error handling, maps, user input, Bangla keywords or concurrency, all of which the language has. Its own repo has broader examples.'],
  ];
  return (
    <section id="notes" className="card window reveal" data-title="honest_notes.md">
      <p className="eyebrow">Limits and threats</p>
      <h2>What this page does not show.</h2>
      <div className="grid2" style={{ marginTop: 16 }}>
        {notes.map(([t, d]) => (
          <div className="tile" key={t}><h3>{t}</h3><p className="hint" style={{ margin: '6px 0 0', fontSize: 13 }}>{d}</p></div>
        ))}
      </div>
    </section>
  );
}
