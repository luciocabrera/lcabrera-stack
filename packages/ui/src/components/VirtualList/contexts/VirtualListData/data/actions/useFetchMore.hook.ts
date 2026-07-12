import { useVirtualListConfigContextValue } from '../../../VirtualListConfig/useVirtualListConfigContextValue.hook';

/** Triggers the parent-provided infinite-scroll fetch, if any. */
export const useFetchMore = () => {
  const { onFetchMore } = useVirtualListConfigContextValue();

  return () => {
    if (onFetchMore) void onFetchMore();
  };
};
