import type { SortItem } from '../../SortingSection.types';

export type SortItemContentProps = {
  readonly isBusy: boolean;
  readonly item: SortItem;
  readonly onRemove: (columnKey: string) => void;
  readonly onToggleDirection: (columnKey: string) => void;
};
