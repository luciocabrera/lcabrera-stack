import { use } from 'react';

import { ChartSettingsContext } from './ChartSettingsContext.context';

export const useChartSettingsContextValue = () => {
  const value = use(ChartSettingsContext);

  if (value === undefined) {
    throw new Error(
      'useChartSettingsContextValue must be used within a ChartSettingsProvider',
    );
  }

  return value;
};
