---
'@lcabrera/devkit': patch
---

`devkit init` and `devkit create` now place `docs/agents/dependency-advisories.json`, the register the dependency audit reads, at the `repo` rung. It carries one allowance, dated to 2026-11-03, for GHSA-vfj7-8cjw-p6xm in `braces`. No patched `braces` exists, and it reaches a created tree only through dev tooling. Without the register, a tree made today fails its own `deps:audit` on that advisory.

The file is yours to edit like any other placed file. `devkit sync` refreshes it until you edit it, and keeps your edits once you have.
