import type { Sorting } from '@/types/ui.types';

import type { SortingState, TableColumn } from '@/components/Table/Table.types';

import { getNormalizedColumns } from '@/components/Table/utils';
import { getNewSortingBasedOnColumnKey } from '@/components/Table/utils/getNewSortingBasedOnColumnKey.util';
import { serializeSortingToURL } from '@/utils/urlState';

type ResolveColumnSortingUpdateArgs<TData> = {
  readonly columns: readonly TableColumn<TData>[];
  readonly existingSorting?: SortingState<TData>;
  readonly persistenceKey: string;
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
      readonly normalizedColumns: ReturnType<
        typeof getNormalizedColumns<TData>
      >;
      readonly persistenceEntry: {
        readonly persistenceKey: string;
        readonly searchParamKey: 'sort';
        readonly searchParamValue?: string;
        readonly slice: 'sorting';
        readonly valueSlice: SortingState<TData>;
      };
      readonly sorting: SortingState<TData>;
    };

export const resolveColumnSortingUpdate = <TData>({
  columns,
  existingSorting = [],
  persistenceKey,
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
    normalizedColumns: getNormalizedColumns({
      columns,
      sorting,
    }),
    persistenceEntry: {
      persistenceKey,
      searchParamKey: 'sort',
      searchParamValue: serializeSortingToURL(sorting),
      slice: 'sorting',
      valueSlice: sorting,
    },
    sorting,
  };
};
