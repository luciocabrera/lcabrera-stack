import type { ListFilterMode } from '../VirtualList.types';

export type IsClientFilterActiveArgs = {
  readonly listFilterMode: ListFilterMode;
  readonly searchTerm: string;
};

/**
 * Whether a client-side filter is narrowing the loaded options — a non-empty
 * search term or a filter mode other than `all`. When true the visible list is
 * a subset of the loaded data, so an under-filled container must not drive
 * infinite-scroll fetching: fetching more pages cannot fill a client-filtered
 * view and would scan the whole dataset (see VirtualListBody).
 */
export const isClientFilterActive = ({
  listFilterMode,
  searchTerm,
}: IsClientFilterActiveArgs) => searchTerm !== '' || listFilterMode !== 'all';
