import { useDataStore } from '../useDataStore.hook';

/**
 * Why the current read returned no rows, when the endpoint said so — a grouping
 * it refused to run, a statement it cut off — or `undefined` when it simply had
 * nothing to return.
 *
 * The distinction is the whole point: without it an empty table is the same
 * picture whether the filters matched nothing or the server declined the query
 * (#642).
 */
export const useGetTableDataError = () => useDataStore((state) => state.error);
