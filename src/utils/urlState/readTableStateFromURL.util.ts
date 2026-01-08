import type {
  ColumnOrderState,
  ColumnVisibilityState,
  SortingState,
} from '@/components/Table/TableContext';

import { readStateFromURL } from './readStateFromURL.util';

type TableSearchParamsState = {
  columnOrder?: ColumnOrderState;
  columnVisibility?: ColumnVisibilityState;
  sorting?: SortingState;
};

const PARAM_KEY = 'tableState';

/**
 * Read table state from URL search params (for SSR)
 * Convenience wrapper around readStateFromURL for table-specific state
 *
 * @param params - Configuration object
 * @param params.persistenceKey - The persistence key prefix for the table
 * @param params.searchParams - URLSearchParams object to read from
 * @returns Decoded table state or undefined if parameter doesn't exist or decoding fails
 *
 * @example
 * ```ts
 * // In a React Router loader
 * export const loader = ({ request }: LoaderFunctionArgs) => {
 *   const url = new URL(request.url);
 *   const tableState = readTableStateFromURL({
 *     persistenceKey: 'carSales',
 *     searchParams: url.searchParams,
 *   });
 *   return { tableState };
 * };
 * ```
 */
export const readTableStateFromURL = ({
  persistenceKey,
  searchParams,
}: {
  persistenceKey: string;
  searchParams: URLSearchParams;
}): Partial<TableSearchParamsState> | undefined => {
  return readStateFromURL({
    convertArraysToSets: ['columnVisibility'],
    key: `${persistenceKey}-${PARAM_KEY}`,
    searchParams,
  }) as Partial<TableSearchParamsState> | undefined;
};
