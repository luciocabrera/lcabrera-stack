---
'@lcabrera/repo-standards': minor
---

`repo-verify-lint-plugins` now also plants a `.tsx` component whose effect reads a prop and passes an empty dependency array. It fails unless Oxlint reports `react-hooks(exhaustive-deps)` for it. The existing `react` probe proves only that the family loads. Once the `@lcabrera/vite-config` ESLint config turns its two copies of the rule off, Oxlint is the only engine that reports a missing hook dependency, so an upgrade or a root `rules` entry that silenced it would otherwise pass every gate. A repository whose root lint config turns `react-hooks/exhaustive-deps` off fails the gate until it turns it back on. A probe entry can now carry a `scope`, the diagnostic prefix Oxlint prints when it differs from the plugin family, and the success line counts distinct families rather than probes.
