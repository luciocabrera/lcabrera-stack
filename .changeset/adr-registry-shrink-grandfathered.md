---
'@lcabrera/repo-standards': minor
---

The ADR duplicate-number exemption is configuration, and defaults to none.

`GRANDFATHERED_DUPLICATES` was a module constant holding `001`–`005` and `008` —
one repository's historical overlap from when each of its ADR homes ran its own
sequence from 001, baked into a shared package. It exempted five numbers that
most consumers never duplicated, and a number the gate permits twice is a
citation that can silently point at the wrong document.

It is now `registers.adrGrandfatheredDuplicates`, alongside `adrHomes` and the
rest, and it defaults to `[]` for the same reason `publicPackageDirs` does: an
overlap is the host repository's own history and cannot be guessed.

**Migration.** A repository whose homes genuinely reuse a number — it passed
`vp run adr:verify` before and now fails with "ADR-0NN is used by 2 documents" —
declares those numbers:

```json
{ "registers": { "adrGrandfatheredDuplicates": [5] } }
```

Entries that are not positive integers are dropped. A repository with no overlap
declares nothing and gets a stricter gate: numbers that were silently exempt are
now checked like every other, and any new repeat is rejected.
