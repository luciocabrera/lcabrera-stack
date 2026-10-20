---
'@lcabrera/devkit': patch
'@lcabrera/repo-standards': patch
'@lcabrera/eslint-plugin': patch
'@lcabrera/ui': patch
---

Internal modules no longer export bindings that nothing outside their own file imports. No subpath named in any package's `exports` changes, and every published entry point keeps the same surface.

- `@lcabrera/devkit`: the internal git runner that throws on failure is now `runGitOrThrow`, so its name says how it differs from `@lcabrera/repo-standards`' `runGit`, which returns `undefined` on failure. The peer-status constants, the profile-flag literal and two closure-artifact predicates are module-private.
- `@lcabrera/repo-standards`: the finding formatters behind `repo-verify-conflict-markers` and `repo-verify-departed-names` are `formatConflictMarker` and `formatDepartedName`. Several module-level constants and helpers are module-private, and `conformance-triggers.cjs` no longer exports `MINIMUM_DESCRIPTION_WORDS`. That file is not one of the package's `exports` subpaths.
- `@lcabrera/eslint-plugin`: `ruleDocsUrl` is private to `create-rule.ts`; rule documentation URLs are unchanged.
- `@lcabrera/ui`: internal Table barrels stop re-exporting a selector, a fold utility and three types that every caller imports from the defining file, and the unused `DesignSystemStyle` type is gone. None of them was reachable from the package's public entry points.
