# Research and engineering review

A graded review of this repo against a doctoral-level rubric, what was fixed on
the `site/live-dashboard` branch, and what each remaining gap would need.

**What the repo is.** Six short example programs for the Jesun.Code language
(`hello`, `fizzbuzz`, `fibonacci`, `todo`, `wordcount`, `primes`). It is a
teaching artifact, not a study: there is no experiment, so the research rows
below are graded for what a teaching resource should claim and support, and the
engineering rows carry most of the weight.

Grades: A (strong), B (adequate), C (weak), D (missing), N/A (does not apply, with reason).

## Scorecard

| Criterion | Before | After | Notes |
| --- | --- | --- | --- |
| Question | C | B | Implicit question: "does each example run and show the feature it claims?" Now answered mechanically by `scripts/check_examples.py` and the feature check in `site/src/check.mjs`. The bigger question, "is plain-English code easier to read?", is stated as a limit, not answered. |
| Hypotheses | D | C | No hypothesis existed. The testable claims are now explicit: each program prints exactly `expected/<name>.out` on jesun.py @1282f9a, and each README-table feature appears in its program. The readability claim is still untested (see gap 1). |
| Method | C | B | Before: "verified" with no procedure. Now: run each program in a temp directory on a pinned interpreter, compare byte for byte, fail on any difference; CI repeats it on every push. |
| Baselines | D | D | No comparison with equivalent Python or another teaching language. Gap 1. |
| Statistics and uncertainty | N/A | N/A | Every program is deterministic; the outputs are exact, so there is no sampling uncertainty to report. Would apply once gap 1's reader study exists. |
| Reproducibility | C | A | Before: README cloned jesun-code HEAD, no recorded outputs, no tests. Now: interpreter pinned to `1282f9a` in README, check script and CI; outputs recorded from the interpreter with `--record`, never typed; one command reproduces everything. |
| Correctness | C | B | `wordcount.jc` reported 10 words and 3 lines for text with 11 words on 2 lines (naive split on a single space and on a trailing newline). Fixed and re-recorded in its own commit. The feature scan is regex based, so it is checked against the README but is not a parser. |
| Threats to validity | D | B | Listed on the dashboard's Limits window: interpreter in another repo, regex scan, browser runner limits, unmeasured readability claim, thin coverage. |
| Related work | D | D | No comparison with prior plain-English or natural-language programming efforts (for example AppleScript, Inform 7, HyperTalk, or block languages for learners). Gap 3. |
| Limitations | D | B | Stated on the dashboard and below. |
| Engineering: tests and CI | D | A | `scripts/check_examples.py` (stdlib only) is the test suite; `.github/workflows/examples.yml` runs it against the pinned interpreter. The dashboard build adds a known-answer check. |
| Engineering: licensing and hygiene | C | A | README said MIT but no LICENSE file existed; added. `.gitignore` added (also ignores the `words.txt` that `wordcount.jc` writes). |
| Engineering: coverage of the language | C | C | Six programs cover variables, interpolation, loops, branches, functions, recursion, lists, file I/O and split. Nothing covers error handling, tables, input, Bangla keywords or fleets (concurrency). Gap 2. |

## Fixed on this branch (cheap)

1. `expected/*.out` recorded from jesun.py @1282f9a for all six programs.
2. `scripts/check_examples.py`: runs each program in a temp directory and diffs against the recording; exits non-zero on a mismatch. `--record` regenerates the recordings.
3. `.github/workflows/examples.yml`: checks out jesun-code at the full pinned SHA and runs the check on every push.
4. README run instructions pin the interpreter commit and document verification.
5. `wordcount.jc` fixed to count 11 words on 2 lines, recording redone.
6. MIT `LICENSE` and `.gitignore` added.
7. Live dashboard (`site/`) with a known-answer check run by `npm run build`: the JS ports of `fibonacci.jc` and `primes.jc` must reproduce the recorded outputs, and their work counts (453 `fib` calls, 44 trial divisions) were measured with instrumented copies of the programs on the real interpreter.

## Remaining gaps and exactly what each needs

1. **The "reads like plain English" claim is unmeasured.** Needs a small within-subjects reader study: about 20 to 30 novice programmers, each shown matched Jesun.Code and Python versions of these six programs in counterbalanced order, measuring time to correctly predict the output and accuracy. Data: the participants' responses (needs an ethics or consent process if published). Compute: negligible; analysis is a paired comparison with confidence intervals. A free first step is a side-by-side Python version of each program with line and token counts, which needs no participants but measures length, not readability.
2. **Thin language coverage.** Needs four or five more programs (error handling with `attempt`, a `table` example, reading input with `ask`, a Bangla-keyword program, a `fleet` concurrency example), each recorded with `--record`. Compute: under a second each on a laptop. Fleet examples may not run in the browser playground and should be marked as such.
3. **No related work.** Needs a short literature note (one to two pages) placing Jesun.Code among natural-language and learner-oriented languages. Data: published papers and language docs; no compute.
4. **Single interpreter version.** The examples are verified on one commit only. Needs a CI matrix over the jesun-code release tags (or a scheduled job against jesun-code HEAD that reports, not fails) so drift is seen early. Compute: a few seconds of free CI per version.
5. **Browser runner covered by a manual check only.** The Pyodide playground was exercised end to end in a headless browser (unedited programs match, an edited program diffs, an endless loop stops at 10 seconds and the runner recovers), but that check is not in CI because it downloads Pyodide. Needs a CI job with network access running the same headless script; cost is roughly a minute of free CI per run.
