---
'@lcabrera/ui': minor
---

The `react` and `react-dom` peer ranges rise from `^19.0.0` to `^19.2.0`. The package imports `Activity` and `useEffectEvent` from `react`, and React exports neither before 19.2.0, so under the old range a project on React 19.0 or 19.1 installed without a warning and then hit an undefined import at runtime. A project on React 19.2.0 or later needs no change; one on an earlier 19.x release now gets a peer-dependency warning at install and must upgrade `react` and `react-dom` to 19.2.0 or later.
