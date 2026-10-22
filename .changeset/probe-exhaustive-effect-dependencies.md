---
'@lcabrera/repo-standards': minor
---

`repo-verify-lint-plugins` now also plants a `.tsx` component whose effect lists a prop it never reads, and fails unless Oxlint reports `react(exhaustive-effect-dependencies)` for it. No other Oxlint rule reports that case, so the gate proves this rule fires, not only that the `react` family loads. A repository whose root lint config turns `react/exhaustive-effect-dependencies` off now fails the gate until it turns it back on. Probe files are now named after their rule as well as their family, so two probes in one family write two files.
