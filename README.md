# Jesun.Code Examples

Real programs written in [Jesun.Code](https://github.com/JesunAhmadUshno/jesun-code),
a programming language that reads like plain English. Every `.jc` file in
this repo runs on the real interpreter, verified.

## Run them

```bash
git clone https://github.com/JesunAhmadUshno/jesun-code.git
cd jesun-code
python3 jesun.py /path/to/example.jc
```

## The examples

| File | What it shows |
| --- | --- |
| `hello.jc` | Variables, `show`, string interpolation |
| `fizzbuzz.jc` | Loops (`repeat`), decisions (`if` / `otherwise if` / `otherwise`) |
| `fibonacci.jc` | Functions (`to ... with`), `give back`, recursion |
| `todo.jc` | Lists, `push`, `for each`, a tiny todo app |
| `wordcount.jc` | File I/O (`write ... to file`, `read file ... giving`), `split of` |
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

MIT. Part of the Jesun.Code project.
