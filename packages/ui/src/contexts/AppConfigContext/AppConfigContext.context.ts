import { createContext } from 'react';

import type { AppConfigContextValue } from './AppConfigContext.types';

export const AppConfigContext = createContext<
  AppConfigContextValue | undefined
>(undefined);

AppConfigContext.displayName = 'AppConfigContext';
