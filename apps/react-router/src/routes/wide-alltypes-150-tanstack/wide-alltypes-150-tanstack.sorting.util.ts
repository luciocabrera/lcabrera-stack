import type { SortingState as TanStackSortingState } from '@tanstack/react-table';

import type { SortingState as AppSortingState } from '@/components/Table';
import type { WideAlltypes150 } from '@/services';

import { serializeSortingToURL } from '@/utils/urlState';

type WideAlltypes150ApiSortingRule = {
  readonly columnKey: keyof WideAlltypes150;
  readonly direction: 'asc' | 'desc';
};

const toAppSortingState = (
  sorting: TanStackSortingState,
): AppSortingState<WideAlltypes150> =>
  sorting.map(({ desc, id }) => ({
    columnKey: id as keyof WideAlltypes150,
    direction: desc ? 'desc' : 'asc',
  }));

/**
 * Convert app sorting state from the loader into TanStack sorting state.
 */
export const toTanStackSortingState = (
  sorting: AppSortingState<WideAlltypes150>,
): TanStackSortingState =>
  sorting.map(({ columnKey, direction }) => ({
    desc: direction === 'desc',
    id: columnKey,
  }));

/**
 * Convert TanStack sorting state into API sort rules.
 */
export const toWideAlltypes150ApiSorting = (
  sorting: TanStackSortingState,
): readonly WideAlltypes150ApiSortingRule[] =>
  sorting.map(({ desc, id }) => ({
    columnKey: id as keyof WideAlltypes150,
    direction: desc ? 'desc' : 'asc',
  }));

/**
 * Serialize TanStack sorting state into the existing `sort` URL param format.
 */
export const toWideAlltypes150SortSearchParam = (
  sorting: TanStackSortingState,
): string | undefined =>
  serializeSortingToURL(toAppSortingState(sorting) as AppSortingState);
