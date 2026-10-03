---
'@lcabrera/repo-standards': minor
---

`repo-verify-harness` now fails a skill, path rule or subagent whose frontmatter does not parse as YAML, and names the file line the parser stopped at. Before this, its reader went line by line and accepted frontmatter that a YAML parser rejects. The common case is an unquoted `description` holding a colon followed by a space. Claude Code loads such a file anyway, so nothing showed the problem until a stricter harness read it.

`parseFrontmatterContent` and `parseFrontmatter` from `./conformance-frontmatter` return one more field, `yamlError`: the parser's message, or `undefined` when the block parses. The package now depends on `yaml`.

**Action needed:** quote any `description` (or other value) that contains `: `, then run `repo-verify-harness` again.
