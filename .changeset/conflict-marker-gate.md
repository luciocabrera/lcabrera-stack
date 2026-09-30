---
'@lcabrera/repo-standards': minor
---

New bin: `repo-verify-conflict-markers`. It reads every tracked text file and
exits 1 on a line that is a merge-conflict marker, printing the file and line of
each one. It matches the markers git writes at the start of a line (seven `<`,
`|` or `>` followed by a space or the line's end, and seven `=` alone) and the
forms a Markdown formatter rewrites them into: a closing marker reprinted as
seven nested block quotes, a marker folded into a table as its first cell, a
marker indented inside a list item, and a separator escaped with a backslash.
`git diff --check` and a search for the raw marker miss all of these, and the
formatter usually runs before any gate does.

Seven `=` alone is also a heading underline, so a separator is reported only in
a file that also holds an opening, base or closing marker. A heading passes; a
real conflict names every marker line.

It reads nothing from `devkit.config.json`. It reads one file at a time and
skips a file holding a NUL byte without decoding it. A test that needs a marker
as content can build the string at runtime rather than commit it. It exits 1
when a tracked file cannot be read (deleted locally, or left out of a sparse
checkout), and when `git ls-files` lists nothing, so a run that did not read
every tracked file does not pass.
