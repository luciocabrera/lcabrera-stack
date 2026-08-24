import { useVirtualListContextValue } from '../../useVirtualListContextValue.hook';

export const useFetchMore = () => {
  const { onFetchMore } = useVirtualListContextValue();

  return () => {
    if (onFetchMore) void onFetchMore();
  };
};
