import type { ListFilterMode } from '../VirtualList.types';

export type IsClientFilterActiveArgs = {
  readonly listFilterMode: ListFilterMode;
  readonly searchTerm: string;
};

export const isClientFilterActive = ({
  listFilterMode,
  searchTerm,
}: IsClientFilterActiveArgs) => searchTerm !== '' || listFilterMode !== 'all';
