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
  /** The applied aggregates — see `getPinnedDerivedColumnsState`. */
  readonly aggregates: readonly TableColumnAggregate[];
  readonly columnOrder: ColumnOrderState<TData>;
  readonly columnPinning: ColumnPinningState<TData>;
  readonly columns: readonly TableColumn<TData>[];
  readonly columnSizing?: ColumnSizingState<TData>;
  readonly columnVisibility?: ColumnVisibilityState<TData>;
  readonly existingSorting?: SortingState<TData>;
  /** The applied group keys — see `getPinnedDerivedColumnsState`. */
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

/**
 * **Re-derives the whole column view state, not just `normalizedColumns`.**
 *
 * A sort changes no column, so rebuilding the pinned partition looks like
 * waste — but the derived fields are only consistent when they are derived
 * *together*, and this is the one action that used to write a subset. It
 * called `getNormalizedColumns` on the consumer's declared column list while
 * leaving `pinnedColumnPartition` alone, which was safe only for as long as
 * the two held the same keys. `withAggregateColumns` broke that: it paints
 * measure columns the declared list has never heard of, so a sort click
 * dropped every one of them from the lookup while the partition still asked
 * `TableHeaderCell` to render them, and the cell destructured `undefined`
 * (#872). Sorting a measure is the feature that shipped those columns, so the
 * crash sat on its own headline path.
 *
 * Taking `aggregates` and `groupingKeys` as **required** arguments is the
 * point rather than an inconvenience: it is what makes a future derivation
 * site fail to compile instead of silently re-deriving from the wrong list.
 * This site was the one the original sweep missed precisely because it reached
 * past `deriveColumnViewState` to the primitive underneath, and so had nothing
 * to fail on.
 */
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
