import type { ColumnFilter } from '#ui/types/filterOperators.types';

export const toBooleanColumnFilter = (filter: ColumnFilter | undefined) =>
  filter?.type === 'boolean' || filter?.type === 'empty' ? filter : undefined;
