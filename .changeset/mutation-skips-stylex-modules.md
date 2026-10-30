---
'@lcabrera/repo-standards': patch
---

`repo-fallow-gate mutation` no longer mutates a changed `*.stylex.ts` file. The StyleX babel plugin cannot compile a module after fallow has rewritten it, so every test that imported the module failed before the first mutant ran, and the gate exited 1 on any change that touched one. The bin now names each skipped file as `not mutated (style module)` and mutates the rest of the change. The only mutants that go are changes to CSS values, which a jsdom test cannot observe.

Each workspace-root run now gets a `--diff-file` too, as the repository-root run already did, built from that root's own changed files with the style modules left out. An untracked file in a workspace is added to that diff as a new file.
