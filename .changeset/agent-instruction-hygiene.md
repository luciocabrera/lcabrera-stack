---
'@lcabrera/devkit': patch
---

The shipped `react-19` seed now teaches compiler-first memoization (not an
absolute ban) and no inline `onClick={() =>`. It stays self-contained — project
law is restated rather than linked — so a consumer repository gets no dead
pointers.
