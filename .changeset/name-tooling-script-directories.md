---
'@lcabrera/vite-config': minor
---

`createBaseCustomRulesLintConfig` and `createCustomRulesLintConfig` accept a `toolingScriptPatterns` option. Each glob it names receives the tooling-script block that files under `scripts/` and `*.config.*` files already get, for a repository whose own commands live in a directory with another name. The default is `[]`, so an existing config lints exactly as before.
