import { useTableConfigContextValue } from '../../useTableConfigContextValue.hook';

export const useSetTableSettingsPanelWidth = () => {
  const { metaStore } = useTableConfigContextValue();

  return (settingsPanelWidth: number) => {
    metaStore.set({ settingsPanelWidth });
  };
};
