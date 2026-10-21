---
'@lcabrera/repo-standards': patch
---

`repo-verify-react-doctor` now blocks only the findings that `react-doctor --blocking <level>` would block. Before it checks severity, it applies the CLI's `ciFailure` surface filter, as the CLI does. By default that filter lets `design`-tagged findings and findings in test or story files through, and `surfaces.ciFailure` in `doctor.config.jsonc` promotes or excludes findings by rule, category, tag or file context. Before this change, the gate blocked those findings even though the CLI would pass them. A config whose only blocking findings were of these kinds now passes. The report still lists every finding.
