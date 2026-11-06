import {
  LINE_CHART,
  LINE_CHART_MONTH_STEPS,
} from '#ui/components/LineChart/LineChart.constants';

import { getMonthIndex } from './getMonthIndex.util';
import { getMonthStart } from './getMonthStart.util';

type GetMonthTicksArgs = {
  readonly end: number;
  readonly start: number;
};

export const getMonthTicks = ({ end, start }: GetMonthTicksArgs) => {
  const firstMonth = getMonthIndex(start - 1) + 1;
  const lastMonth = getMonthIndex(end);
  const step = LINE_CHART_MONTH_STEPS.find(
    (candidate) =>
      Math.floor((lastMonth - firstMonth) / candidate) + 1 <=
      LINE_CHART.maxTimeTicks,
  );

  if (step === undefined) return;

  const first = Math.ceil(firstMonth / step) * step;

  return Array.from(
    { length: Math.floor((lastMonth - first) / step) + 1 },
    (_, index) => getMonthStart(first + index * step),
  );
};
