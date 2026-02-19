import { decodeStateFromURL } from './decodeStateFromURL.util';

type ReadStateFromURLArgs = {
  convertArraysToSets?: string[];
  key: string;
  searchParams: URLSearchParams;
};

/**
 * Read and decode state from URL search parameters
 *
 * @param params - Configuration object
 * @param params.key - The search parameter key to read from
 * @param params.searchParams - URLSearchParams object to read from
 * @param params.convertArraysToSets - Optional array of keys to convert from arrays to Sets
 * @returns Decoded state object or undefined if parameter doesn't exist or decoding fails
 *
 * @example
 * ```ts
 * // In a React Router loader
 * export const loader = ({ request }: LoaderFunctionArgs) => {
 *   const url = new URL(request.url);
 *   const tableState = readStateFromURL({
 *     key: 'tableState',
 *     searchParams: url.searchParams,
 *     convertArraysToSets: ['columnVisibility'],
 *   });
 *   return { tableState };
 * };
 * ```
 */
export const readStateFromURL = ({
  convertArraysToSets,
  key,
  searchParams,
}: ReadStateFromURLArgs): Record<string, unknown> | undefined => {
  const paramValue = searchParams.get(key);
  if (paramValue) {
    return decodeStateFromURL({
      convertArraysToSets,
      encoded: paramValue,
    });
  }
  return undefined;
};
