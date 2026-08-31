import type {
  ColumnOrderState,
  ColumnPinningState,
  ColumnSizingState,
  ColumnVisibilityState,
  SortingState,
  TableColumn,
  TableColumnAggregate,
} from '#ui/components/Table/Table.types';
import type { Sorting } from '#ui/types/ui.types';

import { deriveColumnViewState } from '#ui/components/Table/utils';
import { getNewSortingBasedOnColumnKey } from '#ui/components/Table/utils/getNewSortingBasedOnColumnKey.util';
import { serializeSortingToURL } from '#ui/utils/urlState';

type ResolveColumnSortingUpdateArgs<TData> = {
  readonly aggregates: readonly TableColumnAggregate[];
  readonly columnOrder: ColumnOrderState<TData>;
  readonly columnPinning: ColumnPinningState<TData>;
  readonly columns: readonly TableColumn<TData>[];
  readonly columnSizing?: ColumnSizingState<TData>;
  readonly columnVisibility?: ColumnVisibilityState<TData>;
  readonly existingSorting?: SortingState<TData>;
  readonly groupingKeys: readonly string[];
  readonly sort: Sorting<TData>;
};

type ResolveColumnSortingUpdateResult<TData> =
  | {
      readonly kind: 'ignored';
    }
  | {
      readonly kind: 'unchanged';
    }
  | {
      readonly kind: 'updated';
      readonly persistenceEntry: {
        readonly searchParamKey: 'sorting';
        readonly searchParamValue?: string;
      };
      readonly sorting: SortingState<TData>;
      readonly viewState: ReturnType<typeof deriveColumnViewState<TData>>;
    };

export const resolveColumnSortingUpdate = <TData>({
  aggregates,
  columnOrder,
  columnPinning,
  columns,
  columnSizing,
  columnVisibility,
  existingSorting = [],
  groupingKeys,
  sort,
}: ResolveColumnSortingUpdateArgs<TData>): ResolveColumnSortingUpdateResult<TData> => {
  const { columnKey, direction } = sort;

  if (columnKey === 'actions') {
    return { kind: 'ignored' };
  }

  const currentSort = existingSorting.find(
    (entry) => entry.columnKey === columnKey,
  );

  if (currentSort?.direction === direction) {
    return { kind: 'unchanged' };
  }

  const sorting = getNewSortingBasedOnColumnKey<TData>({
    columnKey,
    existingSorting,
    sorting: direction,
  });

  return {
    kind: 'updated',
    persistenceEntry: {
      searchParamKey: 'sorting',
      searchParamValue: serializeSortingToURL(sorting),
    },
    sorting,
    viewState: deriveColumnViewState<TData>({
      aggregates,
      columnOrder,
      columnPinning,
      columns,
      columnSizing,
      columnVisibility,
      groupingKeys,
      sorting,
    }),
  };
};
