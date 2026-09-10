import type {
  DataKey,
  PinnedColumnInfo,
} from '#ui/components/Table/Table.types';

import { useGetColumnViewState } from './useGetColumnViewState.hook';

export const useGetPinnedColumnInfo = <TData>(columnKey: DataKey<TData>) =>
  useGetColumnViewState<TData>().pinnedColumnOffsets[columnKey] as
    | PinnedColumnInfo
    | undefined;
