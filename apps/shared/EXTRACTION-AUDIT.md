# Extraction Audit

Every module in `src/` was read and deliberately placed before this package
follows the two API servers out of `vite-react-compiler`
([#688](https://github.com/luciocabrera/vite-react-compiler/issues/688), under
epic [#686](https://github.com/luciocabrera/vite-react-compiler/issues/686)).
Each one either **leaves** with the servers because it is car-sales domain or
HTTP-edge code, or it was **promoted** into `@lcabrera/server` /
`@lcabrera/api` because the packages have a real need for it.

**Read this before re-deriving it.** A "leaves" verdict is not "nobody looked" —
it is the audit's answer, and the reason is next to it. If a reason no longer
holds (a new consumer appears, a package grows the surface), that is a new call
to make, not a rediscovery.

The bar applied for a promotion, from the issue: the packages have a real need,
no equivalent already exists there (checked against each package's `exports` map
and `INVENTORY.md`), and it is worth a permanent public export. Genericity alone
did not earn a move: several verdicts below are "reads as infrastructure, is
actually this dataset or this API's edge".

Colocated `*.test.ts` files carry the verdict of the module they test.

## Verdicts

| Module                                                     | Verdict       | Reason                                                                                                                                                                                                                                                                                                                                                  |
| ---------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `index.ts`                                                 | **Leaves**    | The package barrel. It names what the two servers import at runtime and nothing else                                                                                                                                                                                                                                                                    |
| `constants/server.constants.ts`                            | **Leaves**    | `DEFAULT_PAGE_LIMIT` / `DISTINCT_DEFAULT_LIMIT` are this API's endpoint defaults, and the packages already take that stance deliberately — `@lcabrera/api`'s `parseFilterOptionsParams` requires `defaultPageSize` as an argument rather than owning one. `MAX_WIDE_ALLTYPES_LIMIT` and `SANITY_TABLES` are this dataset                                |
| `errors/httpError.ts`                                      | **Leaves**    | An HTTP status is a transport decision, and `@lcabrera/server` is Postgres primitives: ADR-050 has it translate driver rejections into typed errors and a serializable union, and stop there — status mapping is the edge's. No consumer survives the extraction either; the showcase answers with `Response.json(…, { status })`                       |
| `types/api.types.ts` → `SortRule`                          | **Converged** | Field for field `@lcabrera/server`'s exported `ColumnSort`, which every repository here already feeds to `resolveQuerySort`. ADR-039 has `@lcabrera/api`/`@lcabrera/ui` restate it because neither may depend on a Node-only package; this one declares it, so ADR-064 applies and it is now an alias                                                   |
| `types/api.types.ts` → `SortDirection`                     | **Removed**   | Unused. Existed only as `SortRule`'s field type, which the alias supplies                                                                                                                                                                                                                                                                               |
| `types/api.types.ts` → `ApiSuccessResponse`                | **Removed**   | Exported from the barrel, imported by no workspace                                                                                                                                                                                                                                                                                                      |
| `types/api.types.ts` → `PaginationArgs`                    | **Removed**   | Exported from the barrel, imported by no workspace                                                                                                                                                                                                                                                                                                      |
| `types/api.types.ts` → `DbRow`                             | **Leaves**    | A one-line `Readonly<Record<string, unknown>>`. The package's row seam is already pg's `QueryResultRow` type parameter on every executor; a second name for "some row" is not worth a permanent export                                                                                                                                                  |
| `types/api.types.ts` → `PaginatedResponse`                 | **Leaves**    | Looks like a wire contract to promote next to `DistinctValuesResponse`, but nothing converges on it: the showcase's own page types carry an **optional** `total` (#402) plus `error`/`groupingWarning`. Promoting it would add an export no consumer could adopt                                                                                        |
| `types/api.types.ts` → `DbSanityResult`                    | **Leaves**    | The result shape of the sanity check below, and travels with it                                                                                                                                                                                                                                                                                         |
| `types/api.types.ts` → `DistinctValuesResponse`            | **Leaves**    | Already the packages' — re-exported from `@lcabrera/api`, not declared here                                                                                                                                                                                                                                                                             |
| `utils/runStartupDbSanityCheck.util.ts`                    | **Leaves**    | Startup console output for these servers, over the repository below — including the "run this to repopulate" hint. Nothing generic under the logging                                                                                                                                                                                                    |
| `utils/serializeDatabaseValue.util.ts`                     | **Leaves**    | Reads as generic JSON-safety and is half a display decision: objects are already JSON-safe, so `JSON.stringify`-ing them is not serialization but flattening every non-scalar to a string for the wide table's text cells — which is why `c_014` (`jsonb`) and `c_018` (`point`) are typed `string` client-side. Promoting it would promote that choice |
| `features/carSales/carSales.constants.ts`                  | **Leaves**    | The car-sales table, its columns and its sortable set                                                                                                                                                                                                                                                                                                   |
| `features/carSales/carSales.types.ts`                      | **Leaves**    | Car-sales response shapes                                                                                                                                                                                                                                                                                                                               |
| `features/carSales/carSales.repository.ts`                 | **Leaves**    | Car-sales reads. Already composed entirely from `@lcabrera/server` executors — there is no generic residue left in it to promote                                                                                                                                                                                                                        |
| `features/dbSanity/dbSanity.repository.ts`                 | **Leaves**    | Counts `SANITY_TABLES`, i.e. this dataset, one `getRowsCount` per table                                                                                                                                                                                                                                                                                 |
| `features/distinct/parseDistinctSource.util.ts`            | **Promoted**  | Its lookup is now `@lcabrera/server`'s `resolveFilterOptionsSource` (see below). What stays here is the HTTP edge: turning a refusal into this API's 400                                                                                                                                                                                                |
| `features/distinct/distinct.constants.ts`                  | **Leaves**    | The registry itself is this dataset's — which tables and columns the endpoint exposes. Its **shape** is now the package's `FilterOptionsSources`, so each column names its type instead of the repository assuming `text`                                                                                                                               |
| `features/distinct/distinct.repository.ts`                 | **Leaves**    | Authorize-then-read composition over the promoted resolver and `selectFilterOptions`                                                                                                                                                                                                                                                                    |
| `features/enterpriseOrders/enterpriseOrders.constants.ts`  | **Leaves**    | Explicitly not a candidate (#688 §3): the showcase keeps its own copy of this domain on purpose                                                                                                                                                                                                                                                         |
| `features/enterpriseOrders/enterpriseOrders.types.ts`      | **Leaves**    | Same, and already aliases `@lcabrera/server`'s `ColumnFilter` rather than restating it (ADR-064)                                                                                                                                                                                                                                                        |
| `features/enterpriseOrders/enterpriseOrders.repository.ts` | **Leaves**    | Same; composed from the package's executors and filter mappers                                                                                                                                                                                                                                                                                          |
| `features/enterpriseOrders/enterpriseOrders.fixtures.ts`   | **Leaves**    | The filter-contract cases both servers assert against — test support for the two request schemas that leave with them                                                                                                                                                                                                                                   |
| `features/wideAlltypes150/wideAlltypes150.constants.ts`    | **Leaves**    | The wide table's columns, its sortable set and the `c_018` exclusion — this dataset                                                                                                                                                                                                                                                                     |
| `features/wideAlltypes150/wideAlltypes150.repository.ts`   | **Leaves**    | Wide-table reads, over the package's executors                                                                                                                                                                                                                                                                                                          |

## What was promoted, and what it changes

`resolveFilterOptionsSource` — `@lcabrera/server/filters/resolve-filter-options-source.util`.

`selectFilterOptions` allow-lists the column it is handed but takes `schema` and
`table` as data, so a consumer serving a generic distinct-values endpoint — where
all three identifiers arrive on a request — had no package-side answer to _which
sources may be asked at all_. Both consumers in this repo had hand-rolled the
same lookup: `parseDistinctSource` here, and
`apps/react-router/src/routes/api/filter-options/.server/distinct.service.ts` in
the showcase, which stays in this repository after the extraction. The gap was
already written down on the other side of it: `@lcabrera/api`'s
`parseFilterOptionsParams` ends its own contract with "allow-list authorization
happens downstream in the BFF". The registry stays the consumer's data; the
refusal rule is now the package's, tested there.

Behaviour is unchanged for every request either endpoint can legitimately serve.
This package still throws `HttpError` 400 and still distinguishes an unknown
source from an unknown column; the showcase service still returns `undefined`,
and its suite was not touched.

One input class does change, on the showcase side only, and it is a fix rather
than a regression. The old service indexed its registry raw
(`columns[columnName]`), so a column name that is an `Object.prototype` member —
`toString`, `constructor` — passed the "is this column exposed?" guard carrying a
**function** as its `columnType`, then failed downstream in
`assertColumnAllowed` (the name is not among `Object.keys`), throwing out of the
loader as a 500 instead of the 400 that route documents.
`resolveFilterOptionsSource` reads own properties only, so the same request now
takes the documented 400 path. `api-shared` was never exposed to this: its
registry was a `Set`, and `Set.prototype.has` does not consult
`Object.prototype`.

## Adjacent modules the issue named

Neither is under `src/`, so neither is this audit's to move — recorded so the
question is not reopened:

- `apps/api-server/src/utils/parseSortingRules.util.ts` — request parsing:
  Zod over a JSON query param, `HttpError` on refusal, an `allowedColumns` check
  the query builder repeats anyway. The package-side half of it,
  `columnKey` → `QuerySort` with a fallback, is already `resolveQuerySort`.
- `apps/api-server/src/utils/parseJsonQueryParam.util.ts` and
  `apps/api-server-fast/src/utils/parseJsonQueryFields.util.ts` — framework
  specific (an Express param reader vs a Fastify `preValidation` hook), which is
  what `DEDUPLICATION_REPORT.md` already concluded.
