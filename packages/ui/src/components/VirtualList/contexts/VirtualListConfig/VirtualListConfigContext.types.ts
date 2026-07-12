import type { TStore } from '@repo/ui/hooks/useStore.hook';

import type {
  VirtualListConfigState,
  VirtualListProps,
  VirtualListUiState,
} from '../../VirtualList.types';

export type VirtualListConfigContextValue = {
  /** Store managing static list configuration */
  readonly configStore: TStore<VirtualListConfigState>;
  /** Called on selection changes — selection is parent-owned (actions only) */
  readonly onChange: VirtualListProps['onChange'];
  /** Optional mount fetch callback (providers/actions only) */
  readonly onFetchInitial?: VirtualListProps['onFetchInitial'];
  /** Optional infinite-scroll fetch callback (actions only) */
  readonly onFetchMore?: VirtualListProps['onFetchMore'];
  /** Store managing list-owned UI state (search term, filter mode) */
  readonly uiStore: TStore<VirtualListUiState>;
};

export type VirtualListConfigProviderProps = {
  readonly children: React.ReactNode;
  readonly hasCheckboxes: boolean;
  readonly hasSelectAll: boolean;
  readonly name?: string;
  readonly onChange: VirtualListProps['onChange'];
  readonly onFetchInitial?: VirtualListProps['onFetchInitial'];
  readonly onFetchMore?: VirtualListProps['onFetchMore'];
};
