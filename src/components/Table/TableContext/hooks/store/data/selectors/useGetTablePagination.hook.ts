import type { PaginationState } from '@/components/Table/Table.types';

import { useDataStore } from '../useDataStore.hook';

export const useGetTablePagination = () =>
  useDataStore<PaginationState>((state) => state.pagination);
