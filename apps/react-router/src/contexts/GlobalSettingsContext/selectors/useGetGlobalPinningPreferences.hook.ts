import { useGlobalSettingsStore } from '../useGlobalSettingsStore.hook';

export const useGetGlobalPinningPreferences = () => {
  return useGlobalSettingsStore((state) => state.pinning);
};
