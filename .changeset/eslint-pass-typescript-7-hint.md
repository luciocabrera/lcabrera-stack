---
'@lcabrera/repo-standards': patch
---

When `repo-verify-eslint-pass` finds that a rule threw, its hint now covers both ways a plugin fails on TypeScript 7: the `isExternalModuleNameRelative` TypeError and typescript-eslint's "does not support TS 7.0" error. It says the ESLint toolchain needs TypeScript 6. It no longer names a `packageExtensions` entry in a `pnpm-workspace.yaml`, which an installing repository may not have.
