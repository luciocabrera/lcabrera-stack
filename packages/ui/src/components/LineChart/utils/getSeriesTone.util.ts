import type { ChartTone } from '#ui/components/LineChart/LineChart.types';

import {
  LINE_CHART_DEFAULT_TONE,
  LINE_CHART_SERIES_TONES,
} from '#ui/components/LineChart/LineChart.constants';

type GetSeriesToneArgs = {
  readonly index: number;
  readonly tone?: ChartTone;
};

export const getSeriesTone = ({ index, tone }: GetSeriesToneArgs) =>
  tone ??
  LINE_CHART_SERIES_TONES[index % LINE_CHART_SERIES_TONES.length] ??
  LINE_CHART_DEFAULT_TONE;
