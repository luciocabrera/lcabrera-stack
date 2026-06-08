import { useStore } from '@/hooks';

import { INITIAL_GLOBAL_SETTINGS } from './GlobalSettingsContext.constants';
import { GlobalSettingsContext } from './GlobalSettingsContext.context';

import type { GlobalSettingsProviderProps } from './GlobalSettingsContext.types';

export const GlobalSettingsProvider = ({
  children,
  initialSettings,
}: GlobalSettingsProviderProps) => {
  const settingsStore = useStore(initialSettings ?? INITIAL_GLOBAL_SETTINGS);

  return (
    <GlobalSettingsContext value={{ settingsStore }}>
      {children}
    </GlobalSettingsContext>
  );
};
