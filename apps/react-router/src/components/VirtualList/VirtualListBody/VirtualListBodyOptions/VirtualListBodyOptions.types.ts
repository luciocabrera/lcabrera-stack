import type { VirtualListProps } from '../../VirtualList.types';

export type VirtualListBodyOptionsProps = {
  readonly endIndex: number;
  readonly filteredOptions: readonly string[];
  readonly hasCheckboxes: boolean;
  readonly isAllSelected: boolean;
  readonly isLoadingOptions: boolean;
  readonly offsetY: number;
  readonly onChange: VirtualListProps['onChange'];
  readonly selectedValues: readonly string[];
  readonly shouldShowSelectAll: boolean;
  readonly startIndex: number;
  readonly totalHeight: number;
};
