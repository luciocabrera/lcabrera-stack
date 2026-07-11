import type { VirtualListProps } from '../../VirtualList.types';
import type { ResolveContentModeResult } from '../utils/resolveContentMode.util';

export type VirtualListBodyChildrenProps = {
  readonly containerHeight: number;
  readonly contentMode: ResolveContentModeResult;
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
