import { useTableConfigContextValue } from '../../useTableConfigContextValue.hook';

export const useSetTableColumnSettingsSelectedTab = () => {
  const { metaStore } = useTableConfigContextValue();

  return (columnSettingsSelectedTab: string) => {
    metaStore.set({ columnSettingsSelectedTab });
  };
};
