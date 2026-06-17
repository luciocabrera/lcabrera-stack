import type {
  ListFilterMode,
  VirtualListDataState,
  VirtualListProps,
} from '../VirtualList.types';

export type VirtualListBodyProps = {
  readonly dataState: VirtualListDataState;
  readonly hasCheckboxes: boolean;
  readonly hasSelectAll: boolean;
  readonly listFilterMode: ListFilterMode;
  readonly listMaxHeight: string;
  readonly onChange: VirtualListProps['onChange'];
  readonly onFetchInitial?: VirtualListProps['onFetchInitial'];
  readonly onFetchMore?: VirtualListProps['onFetchMore'];
  readonly searchTerm: string;
  readonly selectedValues: readonly string[];
  readonly shouldFillHeight: boolean;
};
