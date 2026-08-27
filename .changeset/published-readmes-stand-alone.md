---
'@lcabrera/repo-standards': patch
'@lcabrera/devkit': patch
'@lcabrera/node': patch
'@lcabrera/ui': patch
---

Make the published READMEs readable with only the installed package on disk.
Every relative link that escaped the package directory is now the absolute URL
the other READMEs already use, the two-package split states its reasoning
instead of only citing the ADR that holds it, and the three references to files
that travel in the repository but not in an install say so.
