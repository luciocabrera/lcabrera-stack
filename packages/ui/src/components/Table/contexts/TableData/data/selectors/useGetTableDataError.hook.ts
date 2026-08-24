import { useDataStore } from '../useDataStore.hook';

/**
 * Why the current read returned no rows, when the endpoint said so — a grouping it refused
 * to run, a statement it cut off — or `undefined` when it simply had nothing to return.
 */
export const useGetTableDataError = () => useDataStore((state) => state.error);
