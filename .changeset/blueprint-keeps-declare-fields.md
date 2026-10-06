---
'@lcabrera/devkit': patch
---

The `full` and `workspace` blueprints' `apps/web/vite.config.ts` now pass `allowDeclareFields: true` to `@babel/preset-typescript`. Without it, preset 7 removes a class field that has no initializer, so a field such as `b: string | undefined;` was missing from the built class even though `tsc` with `useDefineForClassFields` keeps it. A tree created from either blueprint now builds such a field the way `tsc` compiles it. `sync` updates a placed `vite.config.ts` you have not touched; one you have edited is left alone and reported as `modified`, so add the option to its preset yourself.
