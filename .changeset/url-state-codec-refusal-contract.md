---
'@lcabrera/ui': patch
---

URL state params are now read back through a codec with an explicit **refusal
contract**: a param the codec does not recognise yields no state at all, rather
than partly applied state or a value typed as valid while holding something
else.

This changes what a malformed or hand-edited URL does, so it is worth knowing
before upgrading. The behaviour is unchanged for every param this library
produces — only params that never round-tripped through it are affected.

- **`sorting`** — a direction outside `asc`/`desc` used to be cast straight to
  the compact sorting type with no check, so `?sorting={"name":"asc","age":"x"}`
  produced two sort entries and `age`'s direction was typed as a valid direction
  while holding `"x"`. It now yields an unsorted table. The whole sort is
  dropped, including the entries that were fine, because a half-applied sort
  reorders a shared link's rows while still looking like the sort that was
  linked.
- **`filters`** — a param that is not a column-keyed object is now refused
  whole. Previously a JSON array such as `[["ct","hello"]]` was read with array
  indexes as column keys, producing a filter on a column named `0`. Inside a
  recognised object, an unrecognised filter value still drops just that column,
  as before.
- **`<persistenceKey>-tableState`** — a Base64 payload that decodes to an array
  or a scalar is now refused. Previously it was returned as if it were a state
  object.

Undecodable Base64, malformed JSON and unrecognised tokens all degrade to the
declared fallback instead of throwing, so a hand-edited URL never fails a loader.

Consumers using the exported helpers unchanged need do nothing. Anyone
constructing these params by hand should make sure the values match the
documented compact shapes, since a near-miss is now dropped instead of partly
honoured.
