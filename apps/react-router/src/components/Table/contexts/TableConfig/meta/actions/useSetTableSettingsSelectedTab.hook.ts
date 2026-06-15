import { useTableConfigContextValue } from '../../useTableConfigContextValue.hook';

export const useSetTableSettingsSelectedTab = () => {
  const { metaStore } = useTableConfigContextValue();

  return (tableSettingsSelectedTab: string) => {
    metaStore.set({ tableSettingsSelectedTab });
  };
};
