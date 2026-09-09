/**
 * Empty per-column filter-options slot used by fetch-harness tests.
 */

import type { FilterData } from '#ui/components/Table/Table.types';

export const emptyFilterData = (): FilterData => ({
  data: [],
  error: undefined,
  hasMore: false,
  isLoading: false,
  isLoadingMore: false,
  totalLoadedRows: 0,
  totalRows: 0,
});
