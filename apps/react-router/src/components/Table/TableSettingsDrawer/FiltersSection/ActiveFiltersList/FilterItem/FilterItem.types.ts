import type { HandleToggleArgs } from '../ActiveFiltersList.types';

export type FilterItemColumn = {
  readonly label: string;
};

export type FilterItemProps = {
  readonly column: FilterItemColumn;
  readonly columnKey: string;
  readonly expandedFilters: Set<string>;
  readonly filter: NonNullable<HandleToggleArgs['filter']>;
  readonly isBusy: boolean;
  readonly onRemove: (columnKey: string) => void;
  readonly onToggle: (args: HandleToggleArgs) => void;
  readonly onToggleExpanded: (columnKey: string) => void;
};
