---
'@lcabrera/repo-standards': minor
---

New `parseThreadId` export on `./cli-input`, alongside `parsePullNumber` and
`parseRepository`. It accepts a GitHub GraphQL node id in either format still in
circulation and refuses anything a spawned CLI would parse as a flag rather than
a value — see ADR-089.
