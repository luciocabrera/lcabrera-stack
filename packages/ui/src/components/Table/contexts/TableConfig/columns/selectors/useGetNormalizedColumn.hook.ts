import type {
  DataKey,
  NormalizedColumnsState,
} from '#ui/components/Table/Table.types';

import { useGetColumnViewState } from './useGetColumnViewState.hook';

export const useGetNormalizedColumn = <TData>(columnKey: DataKey<TData>) =>
  useGetColumnViewState<TData>().normalizedColumns[
    columnKey
  ] as NormalizedColumnsState<TData>[DataKey<TData>];
