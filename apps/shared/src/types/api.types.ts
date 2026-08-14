export type DbRow = Readonly<Record<string, unknown>>;

export type DbSanityResult = {
  readonly isHealthy: boolean;
  readonly issues: readonly string[];
  readonly tableCounts: Readonly<Record<string, number | undefined>>;
};

/**
 * Re-exported rather than re-declared: `@lcabrera/server` owns this wire
 * contract, and the client half (`fetchDistinctValues`) validates responses
 * against it. Two copies of a shape that has to match across the wire is a
 * silent-drift hazard, not a convenience.
 */
export type { DistinctValuesResponse } from '@lcabrera/api/distinct/distinct.types';

export type PaginatedResponse<TData> = {
  readonly data: readonly TData[];
  readonly hasMore: boolean;
  readonly total: number;
};

/**
 * The request-sort shape, aliased from `@lcabrera/server` rather than restated.
 *
 * It is the same contract, field for field, and every repository here hands its
 * sort rules straight to that package's `resolveQuerySort`. ADR-039 has
 * `@lcabrera/api` and `@lcabrera/ui` each declare their own copy because neither
 * may depend on this Node-only package; that reason does not reach this one,
 * which already declares it — so the rule that applies is
 * [ADR-064](../../../../docs/decisions/ADR-064-converge-app-copies-of-a-declared-contract.md),
 * the same call that made `EnterpriseOrdersFilter` an alias of `ColumnFilter`.
 *
 * The local name stays `SortRule` because that is what this API's request
 * parsers and schemas call it.
 */
export type { ColumnSort as SortRule } from '@lcabrera/server/sort/sort.types';
