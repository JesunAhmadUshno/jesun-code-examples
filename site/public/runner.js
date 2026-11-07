// Runs Jesun.Code programs in Pyodide, off the page's main thread.
// The page creates this worker only when a visitor presses "Run live", so nothing
// here is downloaded on a normal page load. jesun.py sits next to this file.
importScripts('https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js');

const DRIVER = `
import io, os, sys, tempfile
sys.path.insert(0, '/jc')
import jesun

def run_jc(source):
    # A fresh directory per run, so wordcount.jc can write and read its file.
    os.chdir(tempfile.mkdtemp())
    out = io.StringIO()
    interp = jesun.Interpreter(stdin=io.StringIO(''), stdout=out)
    interp.global_env.set('arguments', [])
    try:
        jesun.run_source(source, interp)
    except jesun.JesunError as e:
        out.write(str(e) + '\\n')
    except Exception:
        out.write('I hit something I did not expect and stopped instead of guessing.\\n')
    return out.getvalue()
`;

const ready = (async () => {
  const py = await loadPyodide();
  const res = await fetch('jesun.py');
  if (!res.ok) throw new Error(`could not fetch jesun.py (HTTP ${res.status})`);
  py.FS.mkdirTree('/jc');
  py.FS.writeFile('/jc/jesun.py', await res.text());
  await py.runPythonAsync(DRIVER);
  return py.globals.get('run_jc');
})();
ready.then(() => postMessage({ type: 'ready' }), (err) => postMessage({ type: 'error', error: String(err?.message || err) }));

onmessage = async (e) => {
  try {
    const run = await ready;
    postMessage({ type: 'result', out: run(e.data.source) });
  } catch (err) {
    postMessage({ type: 'error', error: String(err?.message || err) });
  }
};
