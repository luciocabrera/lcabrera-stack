import { useListDataStore } from '../useListDataStore.hook';

/** Total options available server-side (for "Loaded: x / total"), if known. */
export const useGetTotalCount = () =>
  useListDataStore<number | undefined>((state) => state.totalCount);
