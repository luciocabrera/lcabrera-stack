---
'@lcabrera/vite-config': minor
---

`createLintConfig` now fails `vp lint` on a warning and on an `oxlint-disable` directive that silences nothing, and enables `react/exhaustive-effect-dependencies`, `react/no-unstable-nested-components` and `promise/always-return` at error.

Oxlint no longer reads `eslint-disable` directives (`respectEslintDisableDirectives: false`). An `eslint-disable` comment names an ESLint rule, which Oxlint would otherwise report as an unused directive; it keeps working for the ESLint pass. A repository that silenced an Oxlint finding with an `eslint-disable` comment will see that finding after upgrading, as will a repository with a stale `oxlint-disable` comment or one of the three rules firing. Fix the code, or delete the stale directive.
