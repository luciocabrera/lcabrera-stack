import { useSetGlobalPinningPreferences } from './useSetGlobalPinningPreferences.hook';

import type { OrderConflictResolution } from '@/types/pinningPreferences.types';

export const useSetGlobalOrderConflictResolutionPreference = () => {
  const setGlobalPinningPreferences = useSetGlobalPinningPreferences();

  return (orderConflictResolution?: OrderConflictResolution) => {
    setGlobalPinningPreferences({ orderConflictResolution });
  };
};
