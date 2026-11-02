import { niceTicks } from '@lcabrera/utils/chart/nice-ticks.util';

import { LINE_CHART } from '#ui/components/LineChart/LineChart.constants';

import { getMonthIndex } from './getMonthIndex.util';
import { getMonthStart } from './getMonthStart.util';

type GetYearTicksArgs = {
  readonly end: number;
  readonly start: number;
};

export const getYearTicks = ({ end, start }: GetYearTicksArgs) => {
  const startYear = Math.ceil(getMonthIndex(start) / 12);
  const firstYear =
    getMonthStart(startYear * 12).getTime() < start ? startYear + 1 : startYear;

  return niceTicks({
    count: LINE_CHART.tickCount,
    max: Math.floor(getMonthIndex(end) / 12),
    min: firstYear,
  }).map((year) => getMonthStart(year * 12));
};
