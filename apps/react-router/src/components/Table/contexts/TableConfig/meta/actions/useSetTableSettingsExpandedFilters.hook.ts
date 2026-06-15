import { useTableConfigContextValue } from '../../useTableConfigContextValue.hook';

export const useSetTableSettingsExpandedFilters = () => {
  const { metaStore } = useTableConfigContextValue();

  return (tableSettingsExpandedFilters: readonly string[]) => {
    metaStore.set({ tableSettingsExpandedFilters });
  };
};
