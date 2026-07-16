import type {
  SortingState,
  TableColumn,
} from '@repo/ui/components/Table/Table.types';
import type { Sorting } from '@repo/ui/types/ui.types';

import { getNormalizedColumns } from '@repo/ui/components/Table/utils';
import { getNewSortingBasedOnColumnKey } from '@repo/ui/components/Table/utils/getNewSortingBasedOnColumnKey.util';
import { serializeSortingToURL } from '@repo/ui/utils/urlState';

type ResolveColumnSortingUpdateArgs<TData> = {
  readonly columns: readonly TableColumn<TData>[];
  readonly existingSorting?: SortingState<TData>;
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
        readonly searchParamKey: 'sorting';
        readonly searchParamValue?: string;
      };
      readonly sorting: SortingState<TData>;
    };

export const resolveColumnSortingUpdate = <TData>({
  columns,
  existingSorting = [],
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
      searchParamKey: 'sorting',
      searchParamValue: serializeSortingToURL(sorting),
    },
    sorting,
  };
};
