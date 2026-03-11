import type {
  ListFilterMode,
  VirtualListDataState,
} from '../VirtualList.types';

export type VirtualListFooterProps = {
  dataState: VirtualListDataState;
  effectiveOptions: string[];
  hasCheckboxes: boolean;
  listFilterMode: ListFilterMode;
  selectedValues: string[];
  setListFilterMode: (mode: ListFilterMode) => void;
};
