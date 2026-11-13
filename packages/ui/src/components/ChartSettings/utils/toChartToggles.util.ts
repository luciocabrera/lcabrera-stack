import type { ChartSettingsValues } from '../ChartSettings.types';

import {
  CHART_TOGGLE_KEYS,
  CHART_TOGGLE_LABELS,
} from '../ChartSettings.constants';

export const toChartToggles = (settings: ChartSettingsValues) =>
  CHART_TOGGLE_KEYS.filter((key) => settings[key] !== undefined).map((key) => ({
    isChecked: settings[key] === true,
    key,
    label: CHART_TOGGLE_LABELS[key],
  }));
