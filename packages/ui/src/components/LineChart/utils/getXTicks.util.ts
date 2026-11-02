import { niceTicks } from '@lcabrera/utils/chart/nice-ticks.util';

import type { ChartX } from '#ui/components/LineChart/LineChart.types';

import { LINE_CHART } from '#ui/components/LineChart/LineChart.constants';

type GetXTicksArgs = {
  readonly domain: readonly [number, number];
  readonly isTime: boolean;
  readonly ticks?: readonly ChartX[];
};

export const getXTicks = ({ domain, isTime, ticks }: GetXTicksArgs) => {
  if (ticks !== undefined) return ticks;

  const [start, end] = domain;

  if (!isTime)
    return niceTicks({ count: LINE_CHART.tickCount, max: end, min: start });

  const unit = end - start >= LINE_CHART.dayMs ? LINE_CHART.dayMs : 1;

  return niceTicks({
    count: LINE_CHART.tickCount,
    max: end / unit,
    min: start / unit,
  })
    .filter((tick) => Number.isSafeInteger(tick))
    .map((tick) => new Date(tick * unit));
};
