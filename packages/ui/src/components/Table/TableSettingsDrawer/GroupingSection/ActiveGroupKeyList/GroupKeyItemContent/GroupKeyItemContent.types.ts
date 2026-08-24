import type { GroupKeyItem } from '../../GroupingSection.types';

export type GroupKeyItemContentProps = {
  readonly isBusy: boolean;
  readonly item: GroupKeyItem;
  readonly level: number;
  readonly onRemove: (columnKey: string) => void;
};
