import type { ChartSettingsValues } from '../ChartSettings.types';

export const getInitialChartSettingsState = (
  settings: ChartSettingsValues,
) => ({
  applied: settings,
  draft: settings,
  isOpen: false,
  isPinned: false,
});
