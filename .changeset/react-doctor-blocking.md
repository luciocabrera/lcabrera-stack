---
'@lcabrera/repo-standards': minor
---

`repo-verify-react-doctor` now fails on the severity that `doctor.config.jsonc` names in `blocking`: `error` blocks errors, `warning` blocks errors and warnings, `none` blocks nothing, and an absent key means `error`, the CLI's default. Before this, the gate failed on errors whatever the key said, so a config that already sets `"blocking": "warning"` will now fail on warnings it used to pass. An unknown `blocking` value fails the gate instead of falling back; `--report` ignores `blocking` and still never fails on findings.

The gate also fails, naming the file, when a `doctor.config.{ts,mts,cts,js,mjs,cjs,json}` sits beside `doctor.config.jsonc`. React Doctor loads any of those in preference to the `.jsonc`, so the scan would otherwise run on rules the gate never read.
