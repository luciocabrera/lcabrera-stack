import { useGlobalSettingsStore } from '../useGlobalSettingsStore.hook';

export const useGetGlobalUnpinConflictResolutionPreference = () => {
  return useGlobalSettingsStore(
    (state) => state.pinning.unpinConflictResolution,
  );
};
