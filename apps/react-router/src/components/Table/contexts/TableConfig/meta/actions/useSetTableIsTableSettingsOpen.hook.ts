import { useTableConfigContextValue } from '../../useTableConfigContextValue.hook';

export const useSetTableIsTableSettingsOpen = () => {
  const { metaStore } = useTableConfigContextValue();

  return (isTableSettingsOpen: boolean) => {
    metaStore.set({ isTableSettingsOpen });
  };
};
