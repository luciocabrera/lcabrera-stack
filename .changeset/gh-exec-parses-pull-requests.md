---
'@lcabrera/repo-standards': minor
---

`./gh-exec` gains `parsePullRequests`. It turns the JSON `gh pr list` writes on
stdout into an array, and returns an empty one — after printing the warning it
is given — for output that is empty, is not JSON, or is JSON that is not an
array. Callers that previously parsed that output themselves no longer have to
decide what an unusable response means.
