import type { ColumnFilter } from '@lcabrera/server/filters/filters.types';

import type { DbRow, PaginatedResponse } from '../../types/api.types.js';

export type EnterpriseOrderDetailResponse = {
  readonly data: DbRow;
};

/**
 * The enterprise-order filter contract is `@lcabrera/server`'s column-filter
 * contract, aliased rather than restated.
 *
 * ADR-039 has `@lcabrera/ui` and `@lcabrera/server` each declare these shapes
 * independently, because neither package may depend on the other. That reason
 * does not reach this file: `api-shared` already declares `@lcabrera/server` as
 * a dependency and hands the filters it receives straight to that package's
 * `toQueryFilters`, so aliasing costs nothing a duplicate would have bought and
 * removes a copy that can drift. It already had — this alias is what closes the
 * divergence (issue #567); [ADR-064](../../../../../docs/decisions/ADR-064-converge-app-copies-of-a-declared-contract.md)
 * records the rule the two cases split on.
 *
 * The two remaining copies cannot be types at all — a Zod schema in
 * `apps/api-server`, a JSON Schema in `apps/api-server-fast` — so they are held
 * in step behaviourally instead, by the contract cases in
 * `enterpriseOrders.fixtures.ts`.
 */
export type EnterpriseOrdersFilter = ColumnFilter;

export type EnterpriseOrdersFilters = Readonly<
  Record<string, EnterpriseOrdersFilter>
>;

export type EnterpriseOrdersResponse = PaginatedResponse<DbRow>;

export type {
  BooleanFilter,
  DateFilter,
  NumberFilter,
  SelectFilter,
  TextFilter,
} from '@lcabrera/server/filters/filters.types';
