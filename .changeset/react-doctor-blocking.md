---
'@lcabrera/repo-standards': minor
---

`repo-verify-react-doctor` now fails on the severity that `doctor.config.jsonc` names in `blocking`: `error` blocks errors, `warning` blocks errors and warnings, and an absent key falls back to the deprecated `failOn` and then to `error`, exactly as the CLI resolves it. Before this, the gate failed on errors whatever the key said, so a config that already sets `"blocking": "warning"` will now fail on warnings it used to pass. A config that sets `"blocking": "none"` now fails the gate, which refuses to run at a level that blocks nothing; use `--report` for an advisory run. An unknown `blocking` value also fails the gate instead of falling back; `--report` ignores `blocking` and still never fails on findings.

The gate also fails, naming the file, when a `doctor.config.{ts,mts,cts,js,mjs,cjs,json}` sits beside an existing `doctor.config.jsonc`. React Doctor loads any of those in preference to the `.jsonc`, so the scan would otherwise run on rules the gate never read.
