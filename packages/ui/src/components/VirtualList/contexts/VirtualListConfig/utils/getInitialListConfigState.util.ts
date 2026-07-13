import type {
  VirtualListConfigState,
  VirtualListProps,
} from '../../../VirtualList.types';

type GetInitialListConfigStateArgs = {
  readonly hasCheckboxes: boolean;
  readonly hasSelectAll: boolean;
  readonly listMaxHeight: string;
  readonly name?: string;
  readonly onFetchInitial?: VirtualListProps['onFetchInitial'];
  readonly onFetchMore?: VirtualListProps['onFetchMore'];
  readonly shouldFillHeight: boolean;
};

/** Builds the config-store state from the VirtualList public props. */
export const getInitialListConfigState = ({
  hasCheckboxes,
  hasSelectAll,
  listMaxHeight,
  name,
  onFetchInitial,
  onFetchMore,
  shouldFillHeight,
}: GetInitialListConfigStateArgs) => {
  const state: VirtualListConfigState = {
    hasCheckboxes,
    hasFetchInitial: Boolean(onFetchInitial),
    hasFetchMore: Boolean(onFetchMore),
    hasSelectAll,
    listMaxHeight,
    name,
    shouldFillHeight,
  };

  return state;
};
