import { useGlobalSettingsStore } from '../useGlobalSettingsStore.hook';

export const useGetGlobalPinConflictResolutionPreference = () => {
  return useGlobalSettingsStore((state) => state.pinning.pinConflictResolution);
};
