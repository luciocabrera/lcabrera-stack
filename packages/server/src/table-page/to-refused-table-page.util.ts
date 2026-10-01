import type { TablePage } from './table-page.types.ts';

export const toRefusedTablePage = (message: string): TablePage<never> => ({
  data: [],
  error: { kind: 'unexpected', message },
  hasMore: false,
  total: 0,
});
