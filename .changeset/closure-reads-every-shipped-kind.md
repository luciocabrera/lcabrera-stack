---
'@lcabrera/devkit': minor
---

`closure` now reads the shipped files that are not markdown. A workflow's
actions, its step scripts and its secret expressions; the executables any shipped
file invokes out of the install's bin directory; and the paths a definition in
your `paths.agents` directory names in its frontmatter or its plain prose are all
resolved against what the package places.

Until now a file with no markdown structure had nothing for `closure` to read, so
it reported the same clean pass as a file that was genuinely self-contained.
Expect new findings on a tree that has such files: a step running a script the
install does not carry, a local action that does not travel, an executable no
gate task places, and a secret only a repository's own settings could supply. A
secret that something after its own `||` answers is not one of them, and neither
is the token the platform sets itself.

Two new escape kinds appear in the report, `bin` and `secret`, alongside `link`,
`command`, `import` and `requires`. Reading a workflow file is unconditional, and
that is the release. The two new `analyseClosure` options widen what else it can
answer, and each is inert when omitted: `allowedBins` is the roster of
executables the install places, and without it no invocation is resolved;
`agentDirectory` names the directory whose definitions are read as prose, and
without it none is.
