import { useGlobalSettingsStore } from '../useGlobalSettingsStore.hook';

export const useGetGlobalOrderConflictResolutionPreference = () => {
  return useGlobalSettingsStore(
    (state) => state.pinning.orderConflictResolution,
  );
};
