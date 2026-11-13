import { useStore } from '#ui/hooks/useStore.hook';

import type { ChartSettingsState } from '../ChartSettings.types';
import type { ChartSettingsProviderProps } from './ChartSettingsContext.types';

import { getInitialChartSettingsState } from '../utils/getInitialChartSettingsState.util';
import { ChartSettingsContext } from './ChartSettingsContext.context';

export const ChartSettingsProvider = ({
  children,
  initialSettings,
  label,
}: ChartSettingsProviderProps) => {
  const store = useStore<ChartSettingsState>(
    getInitialChartSettingsState(initialSettings),
  );

  return (
    <ChartSettingsContext value={{ label, store }}>
      {children}
    </ChartSettingsContext>
  );
};
