import { createContext } from 'react';

import type { ChartSettingsContextValue } from './ChartSettingsContext.types';

export const ChartSettingsContext = createContext<
  ChartSettingsContextValue | undefined
>(undefined);

ChartSettingsContext.displayName = 'ChartSettingsContext';
