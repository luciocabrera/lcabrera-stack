---
'@lcabrera/repo-standards': minor
---

Make `repo-adr --dry-run` report the decision it reached instead of printing the
template it read.

The dry run used to write the whole rendered record to stdout: the ADR template,
with its instruction comment stripped and its heading filled in. The template is
not the package's file. Its directory is `registers.adrTemplateHome`, which the
installing repository sets, so a preview echoed the bytes of a file at a path
chosen outside the package to the terminal and to whatever collects the
terminal's output.

It now prints one line — the path it would write, the number it took and the
title you gave it:

```
would write docs/decisions/ADR-107-a-decision.md as ADR-107 — A decision
```

That is what the flag exists to confirm. The number and the home are the two
things a new record gets wrong, and both are in the path; the body under them is
a file you already have.

The template is still rendered on this path, so a dry run against a template that
has lost its `# ADR-NNN — …` heading still fails with the same message rather
than passing and failing on the write.

`scaffoldSummary` is new on the `./adr-scaffold` subpath, alongside `renderAdr`,
for anyone building a different front end over the same scaffold.
