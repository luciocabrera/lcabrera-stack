import type { ColumnFiltersState } from '@/components/Table';

export type ActiveFiltersListProps = {
  readonly expandedFilters: Set<string>;
  readonly onExpandedFiltersChange: (expandedFilters: Set<string>) => void;
};

export type HandleFilterChangeArgs = {
  readonly columnKey: string;
  readonly filter: ColumnFiltersState[string];
};

export type HandleToggleArgs = {
  readonly columnKey: string;
  readonly filter?: ColumnFiltersState[string];
};
