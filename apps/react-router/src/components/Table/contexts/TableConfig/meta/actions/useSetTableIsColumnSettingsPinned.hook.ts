import { useTableConfigContextValue } from '../../useTableConfigContextValue.hook';

export const useSetTableIsColumnSettingsPinned = () => {
  const { metaStore } = useTableConfigContextValue();

  return (isColumnSettingsPinned: boolean) => {
    metaStore.set({ isColumnSettingsPinned });
  };
};
