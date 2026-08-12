import type { GroupKeyItem } from '../../GroupingSection.types';

export type GroupKeyItemContentProps = {
  readonly isBusy: boolean;
  readonly item: GroupKeyItem;
  /** Which level this key is, 1-based, as the user reads it. */
  readonly level: number;
  readonly onRemove: (columnKey: string) => void;
};
