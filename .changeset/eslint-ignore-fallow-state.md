---
'@lcabrera/vite-config': patch
---

Both ESLint configs ignore `.fallow/`. fallow writes its run state there, including instrumented copies of the sources it mutates, in whichever root it analyses, so after `fallow mutation --root <package>` the ESLint pass in that package read those copies as source and failed on them.
