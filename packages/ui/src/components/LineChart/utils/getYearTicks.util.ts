import { niceTicks } from '@lcabrera/utils/chart/nice-ticks.util';

import { LINE_CHART } from '#ui/components/LineChart/LineChart.constants';

import { getMonthIndex } from './getMonthIndex.util';
import { getMonthStart } from './getMonthStart.util';

type GetYearTicksArgs = {
  readonly end: number;
  readonly start: number;
};

export const getYearTicks = ({ end, start }: GetYearTicksArgs) => {
  const firstYear = Math.floor(getMonthIndex(start - 1) / 12) + 1;

  return niceTicks({
    count: LINE_CHART.tickCount,
    max: Math.floor(getMonthIndex(end) / 12),
    min: firstYear,
  }).map((year) => getMonthStart(year * 12));
};
