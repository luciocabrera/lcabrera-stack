import { createContext } from 'react';

import type { SettingsDraftContextValue } from './SettingsDraftContext.types';

export const SettingsDraftContext = createContext<
  SettingsDraftContextValue | undefined
>(undefined);

SettingsDraftContext.displayName = 'SettingsDraftContext';
