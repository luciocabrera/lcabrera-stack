---
'@lcabrera/repo-standards': patch
---

`repo-fallow-gate mutation` now passes fallow `--setup-timeout 30m`. fallow waits 2 minutes by default for each test-runner process to start and finish its baseline run without mutants. A change that reaches a few hundred test files can take longer than that, and then the gate exits 4 (could not run) before a single mutant is tested. Set `REPO_FALLOW_GATE_MUTATION_SETUP_TIMEOUT` to any duration fallow accepts (`10m`, `1h`) to use a different value. An empty value keeps the default.
