# Enterprise Orders Fast API Architecture

Fastify route module for `/api/enterprise-orders`.

## Purpose

- Validate enterprise-order query params before they reach the repository.
- Parse JSON-encoded `sort` and `filter` query fields in `preValidation`.
- Delegate SQL generation and data access to the shared `api-shared` repository.

## Files

| File                              | Responsibility                                                                                        |
| --------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `enterpriseOrders.plugin.ts`      | Registers `/paginated`, `/distinct/:columnName`, and `/:orderId` routes plus JSON query parsing hooks |
| `enterpriseOrders.schema.ts`      | Fastify query/params JSON Schema for route validation                                                 |
| `enterpriseOrders.repository.ts`  | Re-exports the shared repository from `api-shared`                                                    |
| `enterpriseOrders.types.ts`       | Re-exports shared filter and response types                                                           |
| `enterpriseOrders.plugin.test.ts` | Route-seam regression coverage for filter validation                                                  |

## Filter Validation Boundary

- The `filter` query param arrives as a JSON string and is parsed in `preValidation`.
- `enterpriseOrders.schema.ts` validates each column filter using a single discriminated object schema driven by `filter.type`.
- This avoids the Fastify/Ajv `oneOf` + `additionalProperties` mutation pitfall that can incorrectly reject valid number filters such as `total_amount < 20`.
- **The vocabulary is validated; the values are not.** `type` and `operator` are closed sets and are checked strictly. A value is not, because a filter arrives from a table the user is still editing: a number input mid-keystroke sends no `value` at all, a cleared text box sends an empty string. `@lcabrera/server`'s mappers define those as drafting states and emit no SQL for them, so a schema stricter than that rejects requests the React Router route serves (#567). What becomes SQL is `toQueryFilters`'s decision, not this schema's — see [ADR-064](../../../../../docs/decisions/ADR-064-converge-app-copies-of-a-declared-contract.md).

## Key Constraint

- Number and currency-backed columns are represented as `type: 'number'` filters at the API boundary.
- Regression coverage should stay at the Fastify injection seam so schema failures are caught before the repository or database layer is involved.
- This JSON Schema is one of the two copies of the filter contract that cannot be a type, so it is guarded behaviourally: `enterpriseOrders.plugin.test.ts` drives every case in `api-shared/filter-contract` through the injection seam and asserts the repository receives exactly the clauses the React Router route would have built from the identical JSON.
- It also asserts the drafting states directly, as its own named regression. The shared set's `drafting` group has no compile-time anchor, so a case removed from it would otherwise stop being checked here with nothing failing — see [ADR-064](../../../../../docs/decisions/ADR-064-converge-app-copies-of-a-declared-contract.md).
