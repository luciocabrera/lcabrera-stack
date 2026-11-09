---
'@lcabrera/repo-standards': patch
---

`repo-verify-docs-paths` now checks a path written with a line suffix (`path:12`, `path:12-30` or `path:12:4`) against the path alone. Before, it looked for a file whose name included the suffix and reported the reference as missing even though the file existed. A suffixed reference to a file that does not exist is still reported, under the path without its suffix. The suffix is stripped only when the text before it contains a `/` and does not start with a URL scheme, so `http://localhost:3001`, `localhost:3001` and a bare `name.json:3` are read the same way as before. `repo-verify-shipped-docs` and `repo-verify-renamed-mentions` normalise a reference the same way, so they read a suffixed path as the path too. The line numbers themselves are not checked.
