import { niceTicks } from '@lcabrera/utils/chart/nice-ticks.util';

import type { ChartX } from '#ui/components/LineChart/LineChart.types';

import { LINE_CHART } from '#ui/components/LineChart/LineChart.constants';

import { getTimeTicks } from './getTimeTicks.util';

type GetXTicksArgs = {
  readonly domain: readonly [number, number];
  readonly isTime: boolean;
  readonly ticks?: readonly ChartX[];
};

export const getXTicks = ({ domain, isTime, ticks }: GetXTicksArgs) => {
  if (ticks !== undefined) return ticks;

  const [start, end] = domain;

  return isTime
    ? getTimeTicks({ end, start })
    : niceTicks({ count: LINE_CHART.tickCount, max: end, min: start });
};
