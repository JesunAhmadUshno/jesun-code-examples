# Jesun.Code Examples

Live dashboard: https://jesunahmadushno.github.io/jesun-code-examples/
(each program beside its recorded output, with a run-it-in-your-browser button)

Real programs written in [Jesun.Code](https://github.com/JesunAhmadUshno/jesun-code),
a programming language that reads like plain English. Every `.jc` file in
this repo runs on the real interpreter, and `scripts/check_examples.py` proves
it: it runs each program and diffs the output against `expected/<name>.out`.

## Run them

The examples are checked against Jesun.Code commit `1282f9a`. Pin it so a later
language change cannot silently break them:

```bash
git clone https://github.com/JesunAhmadUshno/jesun-code.git
git -C jesun-code checkout 1282f9a
python3 jesun-code/jesun.py /path/to/example.jc
```

## Verify them

```bash
JESUN_CODE=jesun-code/jesun.py python3 scripts/check_examples.py
```

Each program runs in a temporary directory and its output must match
`expected/<name>.out` byte for byte. CI (`.github/workflows/examples.yml`) does
the same on every push, with the interpreter pinned at `1282f9a`.

## The examples

| File | What it shows |
| --- | --- |
| `hello.jc` | Variables, `show`, string interpolation |
| `fizzbuzz.jc` | Loops (`repeat`), decisions (`if` / `otherwise if` / `otherwise`) |
| `fibonacci.jc` | Functions (`to ... with`), `give back`, recursion |
| `todo.jc` | Lists, `push`, `for each`, a tiny todo app |
| `wordcount.jc` | File I/O (`write ... to file`, `read file ... giving`), `split of`, nested `for each` |
| `primes.jc` | Nested loops, a prime-checking helper |

## The language in 30 seconds

```jesun-code
note Comments start with "note".

name is "Jesun"
show "Hello, {name}!"

to greet with person
    give back "Hello, {person}!"

show greet with "world"

for each n in [1, 2, 3]
    if n % 2 is 0 then
        show "{n} is even"
    otherwise
        show "{n} is odd"
```

`is` assigns. `show` prints. `give back` returns. `to ... with` defines a
function. That is most of the language.

## License

MIT (see `LICENSE`). Part of the Jesun.Code project.
