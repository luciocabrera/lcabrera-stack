---
'@lcabrera/repo-standards': minor
---

New bin: `repo-verify-conflict-markers`. It reads every tracked text file and
exits 1 on a line that is a merge-conflict marker, printing the file and line of
each one. It matches the markers git writes at the start of a line (seven `<`,
`|` or `>` followed by a space or the line's end, and seven `=` alone) and two
forms a Markdown formatter rewrites them into: a closing marker reprinted as
seven nested block quotes, and a marker folded into a table as its first cell.
`git diff --check` and a search for the raw marker miss both, and the formatter
usually runs before any gate does.

It reads nothing from `devkit.config.json`. A binary file is skipped, and a test
that needs a marker as content can build the string at runtime rather than
commit it. It exits 1 when `git ls-files` lists nothing, so a run outside a
repository does not pass.
