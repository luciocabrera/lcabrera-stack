---
'@lcabrera/repo-standards': minor
---

`repo-verify-harness` reads the directories named in `gates.harness.additionalRoots` in `devkit.config.json`, as well as `.github/skills`, `.claude/rules` and `.claude/agents`. Each entry pairs a `kind` (`skill`, `rule` or `subagent`) with a `dir`, and the artifacts found there get the same frontmatter, reference and description checks. A copy of a harness kept for distribution can be held to the checks its original passes. If an entry names a directory that does not exist, that is reported as a finding. If an entry has an unknown `kind` or no `dir`, the config is refused and the error names the key. `checkConformance` and `collectArtifacts` accept the same list as an optional `additionalRoots` argument. When the argument is absent, `checkConformance` reads the list from the config, and `collectArtifacts` reads only the conventional roots. A repository that sets no key gets the same results as before.
