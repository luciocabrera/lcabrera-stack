import type { ColumnFiltersState } from '@/components/Table';

export type ActiveFiltersListProps = {
  expandedFilters: Set<string>;
  onExpandedFiltersChange: (expandedFilters: Set<string>) => void;
};

export type HandleFilterChangeArgs = {
  columnKey: string;
  filter: ColumnFiltersState[string];
};

export type HandleToggleArgs = {
  columnKey: string;
  filter?: ColumnFiltersState[string];
};
