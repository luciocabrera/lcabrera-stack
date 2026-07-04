import type { ColumnFiltersState } from '@repo/ui/components/Table';

export type ActiveFiltersListProps = {
  readonly expandedFilters: Set<string>;
  readonly isBusy?: boolean;
  readonly isCollapseAllDisabled: boolean;
  readonly isExpandAllDisabled: boolean;
  readonly onCollapseAll: () => void;
  readonly onExpandAll: () => void;
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
