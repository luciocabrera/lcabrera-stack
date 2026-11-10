import { useVirtualListContextValue } from '../../useVirtualListContextValue.hook';

export const useSetIsTopAttached = () => {
  const { listStore } = useVirtualListContextValue();

  return (isTopAttached: boolean) => {
    listStore.set({ isTopAttached });
  };
};
