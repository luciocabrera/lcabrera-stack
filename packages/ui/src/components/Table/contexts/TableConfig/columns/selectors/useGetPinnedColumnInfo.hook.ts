import type {
  DataKey,
  PinnedColumnInfo,
} from '#ui/components/Table/Table.types';

import { useColumnsStore } from '../useColumnsStore.hook';

export const useGetPinnedColumnInfo = <TData>(columnKey: DataKey<TData>) =>
  useColumnsStore<PinnedColumnInfo | undefined, TData>(
    (state) => state.pinnedColumnOffsets[columnKey],
  );
