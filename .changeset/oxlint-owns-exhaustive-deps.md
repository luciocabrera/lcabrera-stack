---
'@lcabrera/vite-config': patch
---

`createCustomRulesLintConfig` now turns off `react-hooks/exhaustive-deps` and `react-x/exhaustive-deps`. The `correctness` category of the `./lint` Oxlint config already reports a missing hook dependency as an error, including a prop left out of an effect's or a callback's dependency array and a ref's `.current` read in an effect cleanup. With all three rules on, a single missing dependency was reported up to three times. A project that uses `./eslint-custom-rules` without `./lint` should turn one of the two ESLint rules back on in its own config.
