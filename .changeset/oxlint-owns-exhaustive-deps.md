---
'@lcabrera/vite-config': minor
---

`createCustomRulesLintConfig` now turns off `react-hooks/exhaustive-deps` and `react-x/exhaustive-deps`. ESLint no longer reports a missing hook dependency, and the `correctness` category of the `./lint` Oxlint config reports it as an error. That covers a prop left out of an effect's or a callback's dependency array and a ref's `.current` read in an effect cleanup.

**This is the breaking part:** the config sets `reportUnusedDisableDirectives: 'error'`, so an `// eslint-disable-next-line react-hooks/exhaustive-deps` or `react-x/exhaustive-deps` comment left in your code now fails the ESLint pass as an unused directive. Delete the directive (`eslint --fix` removes it). If Oxlint now reports that line, either fix the dependency array or replace the comment with `// oxlint-disable-next-line react-hooks/exhaustive-deps`.

A project that uses `./eslint-custom-rules` without `./lint` should turn one of the two ESLint rules back on in its own config.
