import type { RefObject } from 'react';

export type VirtualListBodyProps = {
  readonly containerHeight: number;
  readonly endIndex: number;
  readonly filteredOptions: readonly string[];
  readonly hasCheckboxes: boolean;
  readonly isAllSelected: boolean;
  readonly isInitialLoading: boolean;
  readonly isLoadingOptions: boolean;
  readonly listMaxHeight: string;
  readonly offsetY: number;
  readonly onSelectAll: () => void;
  readonly onToggle: (option: string) => void;
  readonly scrollContainerRef: RefObject<HTMLDivElement | null>;
  readonly selectedValues: readonly string[];
  readonly shouldFillHeight: boolean;
  readonly shouldShowSelectAll: boolean;
  readonly startIndex: number;
  readonly totalHeight: number;
};
