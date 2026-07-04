import { useGlobalSettingsStore } from '../useGlobalSettingsStore.hook';

export const useGetGlobalPinSidePreference = () => {
  return useGlobalSettingsStore((state) => state.pinning.pinSide);
};
