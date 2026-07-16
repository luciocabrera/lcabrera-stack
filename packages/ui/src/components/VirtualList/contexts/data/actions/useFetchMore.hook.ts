import { useVirtualListContextValue } from '../../useVirtualListContextValue.hook';

/** Triggers the parent-provided infinite-scroll fetch, if any. */
export const useFetchMore = () => {
  const { onFetchMore } = useVirtualListContextValue();

  return () => {
    if (onFetchMore) void onFetchMore();
  };
};
