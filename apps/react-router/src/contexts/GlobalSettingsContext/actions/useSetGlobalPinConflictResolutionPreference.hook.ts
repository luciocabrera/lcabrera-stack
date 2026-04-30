import { useSetGlobalPinningPreferences } from './useSetGlobalPinningPreferences.hook';

import type { PinConflictResolution } from '@/types/pinningPreferences.types';

export const useSetGlobalPinConflictResolutionPreference = () => {
  const setGlobalPinningPreferences = useSetGlobalPinningPreferences();

  return (pinConflictResolution: PinConflictResolution | undefined) => {
    setGlobalPinningPreferences({ pinConflictResolution });
  };
};
