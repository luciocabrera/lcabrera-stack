/**
 * The request-sort shape `resolveQuerySort` accepts: a column key plus a
 * direction, which is what a table's sorting state and a paginated request
 * carry. The `sort/` mappers translate it into the `QuerySort[]` the query
 * builders consume.
 *
 * `@lcabrera/api` declares a structurally identical `PaginatedSort`, and
 * `@lcabrera/ui`'s Table produces the same shape. That is duplication on
 * purpose, for the reason `filters.types.ts` documents: both are browser-safe
 * packages, this one is Node-only and its graph includes the Postgres driver,
 * so importing across that line is the edge ADR-038 splits the packages to
 * prevent and ADR-039 refuses to reintroduce. TypeScript's structural typing
 * means a sort built by either package is assignable here with no adapter.
 *
 * One field is deliberately stricter than `PaginatedSort`'s: `direction` is
 * required, because this is the input to an ORDER BY and a rule with no
 * direction has nothing to emit. Apply the default where the request is parsed,
 * which is the only place that knows what the endpoint's default should be.
 */

export type ColumnSort = {
  readonly columnKey: string;
  readonly direction: 'asc' | 'desc';
};
