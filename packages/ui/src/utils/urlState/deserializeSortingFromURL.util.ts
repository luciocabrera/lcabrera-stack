import type { SortingState } from '#ui/components/Table';

import { sortingCodec } from './sortingCodec.util';

export const deserializeSortingFromURL = <TData>(param: string) =>
  Object.entries(sortingCodec.deserialize(param)).map(
    ([columnKey, direction]) => ({
      columnKey: columnKey as SortingState<TData>[number]['columnKey'],
      direction,
    }),
  );
