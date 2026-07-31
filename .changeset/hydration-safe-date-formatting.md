---
'@lcabrera/utils': minor
---

`formatDate` accepts `timeStyle` and `timeZone`.

Both are optional and additive — omitting them produces byte-identical output to
before, so no existing caller changes. `getDateTimeFormatOptions` keeps its
signature.

`timeZone` exists because the default is the _runtime's_ zone, which differs
between an SSR server and the browser: the same instant renders as two different
strings and React reports a hydration mismatch. Passing an explicit zone makes
the output deterministic on both sides. `timeStyle` pairs a time of day with the
existing date `preset`, which previously could only produce a date.

One behaviour note for the error path: when a caller passes `timeZone` and `Intl`
rejects it, the fallback is now the ISO instant rather than
`toLocaleDateString()` — that fallback reads the runtime's zone and would
reintroduce exactly the nondeterminism such a caller is trying to remove.
Callers that pass no `timeZone` keep the previous fallback.
