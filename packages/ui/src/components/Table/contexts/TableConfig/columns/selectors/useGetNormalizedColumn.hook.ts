import type {
  DataKey,
  NormalizedColumnsState,
} from '@repo/ui/components/Table/Table.types';

import { useColumnsStore } from '../useColumnsStore.hook';

export const useGetNormalizedColumn = <TData>(columnKey: DataKey<TData>) =>
  useColumnsStore<NormalizedColumnsState<TData>[DataKey<TData>], TData>(
    (state) => state.normalizedColumns[columnKey],
  );
