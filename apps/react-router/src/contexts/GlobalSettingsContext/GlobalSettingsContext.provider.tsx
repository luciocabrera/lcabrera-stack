import { useStore } from '@/hooks';

import type { GlobalSettingsProviderProps } from './GlobalSettingsContext.types';

import { INITIAL_GLOBAL_SETTINGS } from './GlobalSettingsContext.constants';
import { GlobalSettingsContext } from './GlobalSettingsContext.context';

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
