import { createContext } from 'react';

import type { GlobalSettingsContextValue } from './GlobalSettingsContext.types';

export const GlobalSettingsContext = createContext<
  GlobalSettingsContextValue | undefined
>(undefined);
