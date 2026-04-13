import type {
  ListFilterMode,
  VirtualListDataState,
} from '../VirtualList.types.ts';

export type VirtualListFooterProps = {
  readonly dataState: VirtualListDataState;
  readonly effectiveOptions: readonly string[];
  readonly hasCheckboxes: boolean;
  readonly listFilterMode: ListFilterMode;
  readonly selectedValues: readonly string[];
  readonly setListFilterMode: (mode: ListFilterMode) => void;
};
