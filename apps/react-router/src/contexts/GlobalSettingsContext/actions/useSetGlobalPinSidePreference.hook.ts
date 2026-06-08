import { useSetGlobalPinningPreferences } from './useSetGlobalPinningPreferences.hook';

import type { PinSide } from '@/types/ui.types';

export const useSetGlobalPinSidePreference = () => {
  const setGlobalPinningPreferences = useSetGlobalPinningPreferences();

  return (pinSide: PinSide | undefined) => {
    setGlobalPinningPreferences({ pinSide });
  };
};
