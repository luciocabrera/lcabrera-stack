# URL State Utils Architecture

Compact serialization/deserialization helpers for table state in URL query params.
Designed for shareable links, SSR hydration, and resilient decoding.

## The codec layer

Every param in this folder is read back through a **codec** built by
`createUrlStateCodec`. A codec pairs one `serialize` with one `deserialize` and
takes its entire validation story from a single caller-supplied `narrow`
function. There is no schema type, no combinator and no error object, because
`@lcabrera/ui` ships to browsers without a validation dependency and this is how
a helper grows into a schema library by accident.

**The contract is refusal, not repair.** `narrow` answers `undefined` for any
token outside its vocabulary, and `deserialize` then answers the codec's declared
`fallback` — for the _whole_ payload, never one field of it. A hand-edited param
therefore yields no state at all rather than a partly applied one, so a token
_the narrowing rejects_ never reaches a downstream lookup typed as valid.

That guarantee is exactly as wide as the narrowing each codec supplies and no
wider — one that asserts only an envelope buys nothing about the values inside
it. The per-codec reach is spelled out below, and it is not uniform.
([ADR-061](../../../../../docs/decisions/ADR-061-grouping-config-in-url-expansion-in-store.md)
states why: a malformed param must yield a flat table, not a half-applied query.)

Anything thrown along the way — malformed JSON, a transport that cannot decode,
a narrowing that throws — is a refusal too, so a URL a user edited by hand
degrades instead of failing a loader.

`decodeParam` / `encodeParam` are the factory's optional text layer between the
raw param and the JSON, for a param that carries a transport such as Base64. No
codec here supplies one: every param this folder owns is plain JSON, and
[ADR-061](../../../../../docs/decisions/ADR-061-grouping-config-in-url-expansion-in-store.md)
puts the `grouping` param in that same compact-JSON style.

Each codec's `narrow` chooses what "unrecognised" means for its param:

| Codec          | Vocabulary it checks                                                      | Fallback |
| -------------- | ------------------------------------------------------------------------- | -------- |
| `sortingCodec` | every value is `asc` or `desc`; one bad direction refuses the lot         | `{}`     |
| `filtersCodec` | the envelope is a column-keyed object; each value via `deserializeFilter` | `{}`     |

`filtersCodec` keeps the pre-existing per-entry drop inside a recognised object,
and it is worth being exact about what that drop covers. `deserializeFilter`
does **not** reject an unknown operator code — its last branch reads any
all-strings array as a select-equals filter, so `["ZZ","x"]` produces a select
filter over the values `ZZ` and `x`. The pass that rejects a filter a column
cannot carry is `sanitizeFiltersByColumns` in the loader path: it drops unknown
column keys and runs `isFilterCompatibleWithColumn` against each column's
declared `dataType`. Note it runs **only when the loader passes `columns`**,
which is optional on `readTableLoaderStateFromRequest` — a loader that omits
them gets the filters unchecked. The codec closes the envelope; that pass closes
the rest when it runs.

**There is no `tableState` param.** A Base64 `<persistenceKey>-tableState`
envelope carrying `columnOrder` / `columnVisibility` used to be read here, and
nothing ever wrote it — the persist-cookie flow (ADR-010) writes those two slices
to the cookie and gives them no `searchParamKey`. Its encoder, reader chain and
state type were retired in #566 rather than left as a plausible-looking home for
new state. Order and visibility reach a loader through
`readPersistedStateFromCookie`; `sorting` and `filters` are the URL-borne slices,
and they have the two codecs above.

**No codec here validates a column key.** The vocabularies above are _value_
vocabularies; a key is any string. Sorting keys are checked server-side in
`buildOrderByClause` — `assertSafeIdentifier` on every column with no caller
opt-out, and `assertColumnAllowed` only for queries that pass `allowedColumns`.
Filter keys are checked in the loader by `sanitizeFiltersByColumns`, when the
loader passes it `columns`.

A narrowing rebuilds its state with `Object.fromEntries`, never by assigning
into `{}`. Plain assignment routes a `__proto__` key to the prototype setter and
silently drops it — a per-field drop, which is the outcome this contract exists
to rule out. `Object.fromEntries` defines an own property instead, so the key
survives and `Object.prototype` is untouched.

## File Structure

```
urlState/
├── ARCHITECTURE.md
├── index.ts
├── urlState.types.ts
├── createUrlStateCodec.util.ts
├── sortingCodec.util.ts
├── filtersCodec.util.ts
├── groupingCodec.util.ts
├── serializeSortingToURL.util.ts
├── deserializeSortingFromURL.util.ts
├── serializeGroupingToURL.util.ts
├── deserializeGroupingFromURL.util.ts
├── serializeFiltersToURL.util.ts
├── serializeFilter.util.ts
├── serializeBooleanFilter.util.ts
├── serializeDateFilter.util.ts
├── serializeSelectFilter.util.ts
├── serializeNumberFilter.util.ts
├── serializeTextFilter.util.ts
├── getSerializedOperator.util.ts
├── deserializeFilter.util.ts
└── deserializeFiltersFromURL.util.ts
```

## Dependency Graph

```mermaid
graph TD
  Index[URL state index] --> DSF[Deserialize filters utility]
  Index --> DSS[Deserialize sorting utility]
  Index --> DSG[Deserialize grouping utility]
  Index --> SFU[Serialize filters utility]
  Index --> SSU[Serialize sorting utility]
  Index --> SGU[Serialize grouping utility]

  DSS --> SortingCodec[sortingCodec]
  SSU --> SortingCodec
  DSF --> FiltersCodec[filtersCodec]
  SFU --> FiltersCodec
  DSG --> GroupingCodec[groupingCodec]
  SGU --> GroupingCodec

  SortingCodec --> Factory[createUrlStateCodec]
  FiltersCodec --> Factory
  GroupingCodec --> Factory
  Factory --> Logger[logger]

  FiltersCodec --> DF[Deserialize single filter utility]
  FiltersCodec --> SF[serializeFilter dispatcher]
  DF --> FilterConstants[Filter operator constants]
  SF --> SBF[serializeBooleanFilter]
  SF --> SDF[serializeDateFilter]
  SF --> SSF[serializeSelectFilter]
  SF --> SNF[serializeNumberFilter]
  SF --> STF[serializeTextFilter]
  SDF --> GSO[getSerializedOperator]
  SNF --> GSO
  STF --> GSO
```

## Utilities

### createUrlStateCodec.util.ts

Builds a codec from `compact`, `narrow`, `fallback`, a `label` for the debug log,
and the optional `decodeParam`/`encodeParam` transport.

```mermaid
flowchart TD
  A[deserialize param] --> B[decodeParam, default identity]
  B --> C[JSON.parse]
  C --> D[narrow]
  D -- state --> E[Return state]
  D -- undefined --> F[Log refusal]
  F --> G[Return fallback]
  B -- throws --> H[Log parse failure]
  C -- throws --> H
  D -- throws --> H
  H --> G
```

`serialize` is the mirror: `compact` then `JSON.stringify` then `encodeParam`. It
always produces a string — whether the param belongs in the URL at all is the
caller's decision, which is why `serializeSortingToURL` and
`serializeFiltersToURL` return early on empty state before reaching the codec.

### urlState.types.ts

`CompactSorting` — names the closed `{ columnKey: 'asc' | 'desc' }` wire form of
the `sorting` param. `sortingCodec` is its consumer: it is the vocabulary that
codec's narrowing checks a URL-supplied token against.

`CompactGrouping` — names the `{ keys: string[] }` wire form of the `grouping`
param. Plain compact JSON with no transport layer, the same style as `sorting`
and `filters` (ADR-061).

### sortingCodec.util.ts

Codec for the `sorting` param. Its narrowing checks every entry's direction
first, short-circuiting on the first one that is not `asc` or `desc`, and only
then rebuilds the record with `Object.fromEntries`.

### filtersCodec.util.ts

Codec for the `filters` param. Its narrowing checks the envelope, then routes
each value through `deserializeFilter`.

### groupingCodec.util.ts

Codec for the `grouping` param. Its narrowing admits **one** member, named
`keys`, holding an array of strings — a second member, a misspelling, or one
non-string element refuses the whole payload.

The single-member check is also what makes `__proto__` a non-issue without
`Object.fromEntries`: `JSON.parse` hands it back as an own property, so a payload
carrying one has two entries and is refused, and one carrying only it is refused
for not being named `keys`.

**Its reach stops at the envelope.** The keys stay arbitrary strings here — which
columns are legal group keys is a question about a route, not about a URL, and it
is answered by `sanitizeGroupingByColumns` in the loader path, then by
`assertGroupKeys` in `@lcabrera/server`. Both of those refuse whole too, so the
contract is the same at every step: a flat table, never a half-applied query.

### serializeSortingToURL.util.ts

Compacts sorting array into object map for shorter query payload.

```mermaid
flowchart TD
  A[Serialize sorting to URL] --> B[Reduce to key direction record, skipping undefined]
  B --> C{Record empty}
  C -- yes --> D[undefined, param left off the URL]
  C -- no --> E[sortingCodec.serialize]
```

Example transform:

- Input: `[{ columnKey: 'name', direction: 'asc' }]`
- Output: `{"name":"asc"}`

### deserializeSortingFromURL.util.ts

Rebuilds sorting array from compact object representation.

```mermaid
flowchart TD
  A[Deserialize sorting from URL] --> B[sortingCodec.deserialize]
  B -- refused, unparseable, or empty --> C[Return empty array]
  B -- compact record --> D[Object.entries]
  D --> E[Map entries to sorting items]
  E --> F[Return SortingState]
```

Column keys stay bare strings here, and the loader path does not check them
against a table's real columns — `sanitizeSorting` drops only undirected entries
and the UI-only `actions` key. The column guard is server-side, in
`buildOrderByClause`.

### serializeFiltersToURL.util.ts

Compacts column filters into JSON string using short operator codes and reduced shape.

```mermaid
flowchart TD
  A[Serialize filters to URL] --> B{No filters}
  B -- yes --> C[undefined, param left off the URL]
  B -- no --> D[filtersCodec.serialize]
  D --> E[compact: serializeFilter per column]
  E --> F[JSON.stringify]
```

`serializeFilter` behavior by filter type:

- `boolean` -> bare boolean
- `text/number/date` -> `[shortOp, value]` or `[shortOp, value, value2]`
- `select/multiSelect` -> values array or `['!', ...values]` for `notEquals`

### serializeFilter.util.ts

Dispatches a single `ColumnFilter` to the matching leaf serializer.

### getSerializedOperator.util.ts

Maps long operator names to their short codes using `OPERATOR_TO_SHORT`.

### serializeBooleanFilter.util.ts

Serializes boolean filters as bare booleans.

### serializeDateFilter.util.ts

Serializes date filters using short operator codes and optional `value2` for between filters.

### serializeSelectFilter.util.ts

Serializes select and multi-select filters as arrays, including `['!', ...values]` for `notEquals`.

### serializeNumberFilter.util.ts

Serializes number filters using short operator codes and optional `value2` for between filters.

### serializeTextFilter.util.ts

Serializes text filters as `[shortOp, value]`.

### deserializeFilter.util.ts

Infers filter type from compact value shape and expands short codes.

```mermaid
flowchart TD
  A[Deserialize single filter] --> B{Boolean value}
  B -- yes --> C[Return boolean filter]
  B -- no --> D{Array value}
  D -- no --> E[undefined]
  D -- yes --> F{Empty array}
  F -- yes --> E
  F -- no --> G[Read first token]

  G --> H{First token is marker}
  H -- yes --> I[select notEquals]

  G --> J{Known operator code}
  J -- yes --> K[Expand operator]
  K --> L{Numeric payload}
  L -- yes --> M[number filter]
  K --> N{Date like payload with date operator}
  N -- yes --> O[date filter]
  K --> P{Text operator with string payload}
  P -- yes --> Q[text filter]

  J -- no --> R{All strings array}
  R -- yes --> S[select equals filter]
  R -- no --> E
```

### deserializeFiltersFromURL.util.ts

Deserializes complete filters payload by applying `deserializeFilter` per entry.

```mermaid
flowchart TD
  A[Deserialize filters from URL] --> B[filtersCodec.deserialize]
  B -- not a column-keyed object, or unparseable --> C[Return empty filters object]
  B -- envelope recognised --> D[Map entries through single filter parser]
  D --> E[Drop entries the parser refused]
  E --> F[Return ColumnFiltersState]
```

## Public API

`index.ts` exports:

- `deserializeFiltersFromURL`
- `deserializeGroupingFromURL`
- `deserializeSortingFromURL`
- `serializeFiltersToURL`
- `serializeGroupingToURL`
- `serializeSortingToURL`

The codecs and the factory are **not** barrelled. Nothing outside this folder
consumes them, and per ADR-007 a barrel exports what is actually imported
through it; each codec imports `createUrlStateCodec` by file path.
