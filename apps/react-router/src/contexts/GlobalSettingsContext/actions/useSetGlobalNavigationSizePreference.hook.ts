import { useSetGlobalNavigationPreferences } from './useSetGlobalNavigationPreferences.hook';

import type { GlobalNavigationSizePreference } from '@/types/globalSettings.types';

export const useSetGlobalNavigationSizePreference = () => {
  const setGlobalNavigationPreferences = useSetGlobalNavigationPreferences();

  return (size: GlobalNavigationSizePreference | undefined) => {
    setGlobalNavigationPreferences({ size });
  };
};
