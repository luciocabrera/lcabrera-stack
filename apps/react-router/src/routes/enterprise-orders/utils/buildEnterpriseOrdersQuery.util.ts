import type {
  ColumnFiltersState,
  SortingState,
  TableColumn,
} from '@lcabrera/ui/components/Table';

import { appendPrimaryKeySorting } from '@lcabrera/ui/routing/shared/appendPrimaryKeySorting.util';
import { sanitizeSorting } from '@lcabrera/ui/routing/shared/sanitizeSorting.util';

import type { EnterpriseOrderListRow } from '../config';

import { toOrderCursorValues } from './toOrderCursorValues.util';

type BuildEnterpriseOrdersQueryArgs = {
  readonly columnsState: {
    readonly columnFilters: ColumnFiltersState<EnterpriseOrderListRow>;
    readonly columns: readonly TableColumn<EnterpriseOrderListRow>[];
    readonly sorting?: SortingState<EnterpriseOrderListRow>;
  };
  readonly lastRow?: EnterpriseOrderListRow;
  readonly limit: number;
  readonly skip: number;
};

/**
 * Build the paginated fetch params for enterprise orders from the current
 * table columns state: sanitizes the sorting and appends the primary-key
 * tiebreaker for stable pagination (ADR-008).
 *
 * That tiebreaker is also what makes the sort a total order, so the last loaded
 * row doubles as a keyset cursor — the server seeks past it instead of counting
 * `skip` rows (ADR-052). `skip` is still sent: it is the rows-loaded count, and
 * the fallback whenever the cursor cannot be trusted.
 */
export const buildEnterpriseOrdersQuery = ({
  columnsState,
  lastRow,
  limit,
  skip,
}: BuildEnterpriseOrdersQueryArgs) => {
  const sorting = appendPrimaryKeySorting<EnterpriseOrderListRow>({
    columns: columnsState.columns,
    sorting: sanitizeSorting<EnterpriseOrderListRow>(
      columnsState.sorting ?? [],
    ),
  });

  return {
    cursor: toOrderCursorValues({ lastRow, sorting }),
    filter: columnsState.columnFilters,
    limit,
    skip,
    sorting,
  };
};
