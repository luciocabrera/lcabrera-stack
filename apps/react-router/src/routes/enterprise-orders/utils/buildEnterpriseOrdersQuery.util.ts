import type {
  ColumnFiltersState,
  SortingState,
  TableColumn,
} from '@repo/ui/components/Table';

import { appendPrimaryKeySorting } from '@repo/ui/routing/appendPrimaryKeySorting.util';
import { sanitizeSorting } from '@repo/ui/routing/sanitizeSorting.util';

import type { EnterpriseOrder } from '../config';

type BuildEnterpriseOrdersQueryArgs = {
  readonly columnsState: {
    readonly columnFilters: ColumnFiltersState<EnterpriseOrder>;
    readonly columns: readonly TableColumn<EnterpriseOrder>[];
    readonly sorting?: SortingState<EnterpriseOrder>;
  };
  readonly limit: number;
  readonly skip: number;
};

/**
 * Build the paginated fetch params for enterprise orders from the current
 * table columns state: sanitizes the sorting and appends the primary-key
 * tiebreaker for stable pagination (ADR-008).
 */
export const buildEnterpriseOrdersQuery = ({
  columnsState,
  limit,
  skip,
}: BuildEnterpriseOrdersQueryArgs) => ({
  filter: columnsState.columnFilters,
  limit,
  skip,
  sorting: appendPrimaryKeySorting<EnterpriseOrder>({
    columns: columnsState.columns,
    sorting: sanitizeSorting<EnterpriseOrder>(columnsState.sorting ?? []),
  }),
});
