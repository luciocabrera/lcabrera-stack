import type {
  VirtualListConfigState,
  VirtualListProps,
} from '../../../VirtualList.types';

type GetInitialListConfigStateArgs = {
  readonly hasCheckboxes: boolean;
  readonly hasSelectAll: boolean;
  readonly name?: string;
  readonly onFetchInitial?: VirtualListProps['onFetchInitial'];
  readonly onFetchMore?: VirtualListProps['onFetchMore'];
};

/** Builds the config-store state from the VirtualList public props. */
export const getInitialListConfigState = ({
  hasCheckboxes,
  hasSelectAll,
  name,
  onFetchInitial,
  onFetchMore,
}: GetInitialListConfigStateArgs) => {
  const state: VirtualListConfigState = {
    hasCheckboxes,
    hasFetchInitial: Boolean(onFetchInitial),
    hasFetchMore: Boolean(onFetchMore),
    hasSelectAll,
    name,
  };

  return state;
};
