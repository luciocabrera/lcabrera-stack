import type { TableProps } from '../Table.types';

export type TableContentProps<T extends Record<string, unknown>> = Omit<
  TableProps<T>,
  'initialColumnOrder' | 'initialColumnVisibility' | 'initialMeta' | 'initialSorting' | 'isFlexWrapperEnabled'
>;
