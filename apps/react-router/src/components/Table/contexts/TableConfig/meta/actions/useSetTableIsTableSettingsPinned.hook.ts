import { useTableConfigContextValue } from '../../useTableConfigContextValue.hook';

export const useSetTableIsTableSettingsPinned = () => {
  const { metaStore } = useTableConfigContextValue();

  return (isTableSettingsPinned: boolean) => {
    metaStore.set({ isTableSettingsPinned });
  };
};
