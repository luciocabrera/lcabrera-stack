import type {
  DataKey,
  NormalizedColumnsState,
} from '@/components/Table/Table.types';

import { useColumnsStore } from '../useColumnsStore.hook.ts';

export const useGetNormalizedColumn = <TData>(columnKey: DataKey<TData>) =>
  useColumnsStore<NormalizedColumnsState<TData>[DataKey<TData>], TData>(
    (state) => state.normalizedColumns[columnKey],
  );
