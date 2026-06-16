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

## Key Constraint

- Number and currency-backed columns are represented as `type: 'number'` filters at the API boundary.
- Regression coverage should stay at the Fastify injection seam so schema failures are caught before the repository or database layer is involved.
