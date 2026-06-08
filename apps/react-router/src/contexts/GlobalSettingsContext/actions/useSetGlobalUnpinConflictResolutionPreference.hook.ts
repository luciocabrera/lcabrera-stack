import { useSetGlobalPinningPreferences } from './useSetGlobalPinningPreferences.hook';

import type { UnpinConflictResolution } from '@/types/pinningPreferences.types';

export const useSetGlobalUnpinConflictResolutionPreference = () => {
  const setGlobalPinningPreferences = useSetGlobalPinningPreferences();

  return (unpinConflictResolution: UnpinConflictResolution | undefined) => {
    setGlobalPinningPreferences({ unpinConflictResolution });
  };
};
