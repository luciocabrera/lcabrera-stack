---
'@lcabrera/repo-standards': minor
---

`./gh-exec` gains `parsePullRequests`. It turns the JSON `gh pr list` writes on
stdout into an array. Output that is not JSON, or is JSON that is not an array,
is unusable in the same way and takes the same path: the warning the caller
passes goes to stderr and the result is an empty array. No output at all is an
empty array and no warning — the command printed nothing, and there is nothing
to say about it. Callers that previously parsed that output themselves no longer
have to decide what an unusable response means.
