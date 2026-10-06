---
'@lcabrera/devkit': patch
---

The `full` and `workspace` blueprints now pass `allowDeclareFields: true` to `@babel/preset-typescript` in the web app's Vite config. Without it, preset 7 removes a class field that has no initializer, so a field such as `b: string | undefined;` was missing from the built class even though `tsc` with `useDefineForClassFields` keeps it. A tree created from either blueprint now builds such a field the way `tsc` compiles it. `sync` updates that config if you have not touched it. If you have edited it, it is left alone and reported as `modified`, so add the option to the preset yourself.
