#!/usr/bin/env python3
"""Run every example on the real interpreter and diff it against expected/<name>.out.

Usage:
    JESUN_CODE=/path/to/jesun-code/jesun.py python3 scripts/check_examples.py
    python3 scripts/check_examples.py --record   # rewrite expected/ from the interpreter

The interpreter defaults to ../jesun-code/jesun.py (a sibling clone). The
recorded outputs come from jesun-code commit 1282f9a. Each program runs in its
own temporary directory, so file-writing examples leave nothing behind.
Exits non-zero if any program's output differs or it fails.
"""
import difflib
import os
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
EXPECTED = ROOT / "expected"


def run(interp: Path, program: Path) -> tuple[int, str]:
    with tempfile.TemporaryDirectory() as tmp:
        proc = subprocess.run(
            [sys.executable, str(interp), str(program)],
            cwd=tmp, capture_output=True, text=True, timeout=60,
        )
    return proc.returncode, proc.stdout + proc.stderr


def main() -> int:
    record = "--record" in sys.argv
    interp = Path(os.environ.get("JESUN_CODE", ROOT.parent / "jesun-code" / "jesun.py")).resolve()
    if not interp.is_file():
        print(f"interpreter not found: {interp} (set JESUN_CODE)")
        return 2
    programs = sorted(ROOT.glob("*.jc"))
    failed = 0
    for program in programs:
        code, out = run(interp, program)
        target = EXPECTED / f"{program.stem}.out"
        if record:
            EXPECTED.mkdir(exist_ok=True)
            target.write_text(out)
            print(f"recorded {target.relative_to(ROOT)}")
            continue
        want = target.read_text() if target.exists() else None
        if code == 0 and out == want:
            print(f"ok    {program.name}")
            continue
        failed += 1
        print(f"FAIL  {program.name} (exit {code})")
        sys.stdout.writelines(difflib.unified_diff(
            (want or "").splitlines(True), out.splitlines(True),
            f"expected/{program.stem}.out", "actual"))
    if not record:
        print(f"{len(programs) - failed}/{len(programs)} examples match")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
