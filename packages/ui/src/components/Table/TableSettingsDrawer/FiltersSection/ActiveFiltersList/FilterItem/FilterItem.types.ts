import type { ColumnFiltersState } from '@repo/ui/components/Table';

export type FilterItemColumn = {
  readonly label: string;
};

export type FilterItemProps = {
  readonly column: FilterItemColumn;
  readonly columnKey: string;
  readonly filter: NonNullable<ColumnFiltersState[string]>;
  readonly isBusy: boolean;
};
