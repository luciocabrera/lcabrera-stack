---
'@lcabrera/repo-standards': minor
---

`repo-verify-lint-plugins` now fails when a workspace `vite.config.ts` declares `fmt` or `staged`, as it already did for `lint`. Vite+ applies a package's own `fmt` block when `vp fmt` runs from that package's directory, but `vp check` never does, so the same file could be formatted two ways depending on where the command ran. `vp staged` reads only the `vite.config.ts` in its working directory, so a package `staged` block replaces the root chain for a run started there. Each failure names its remedy: a `lint` rule goes in the root `lint.overrides`, a path `fmt` must skip goes in the root `fmt` `ignorePatterns`, and a staged command goes in the root `staged` chain. A repository whose workspace configs carry either block fails the gate until it moves them to the root config. The root `vite.config.ts` is still exempt.
