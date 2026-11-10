import type { LineSeries } from '@lcabrera/ui/components/LineChart';

import type { TrendModel } from './EvalsAdjudications.types';

export const accuracyChartSeries = (trend: readonly TrendModel[]) =>
  trend.map(({ model, points }): LineSeries => ({
    id: model,
    label: model,
    points: points.map(({ at, label, value }) => ({
      label,
      x: new Date(at),
      y: value,
    })),
  }));
