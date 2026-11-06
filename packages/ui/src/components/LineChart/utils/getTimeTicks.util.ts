import {
  LINE_CHART,
  LINE_CHART_TIME_STEPS,
} from '#ui/components/LineChart/LineChart.constants';

import { getMonthTicks } from './getMonthTicks.util';
import { getStepTicks } from './getStepTicks.util';
import { getYearTicks } from './getYearTicks.util';

type GetTimeTicksArgs = {
  readonly end: number;
  readonly start: number;
};

export const getTimeTicks = ({ end, start }: GetTimeTicksArgs) => {
  const step = LINE_CHART_TIME_STEPS.find(
    (candidate) =>
      Math.floor((end - start) / candidate) + 1 <= LINE_CHART.maxTimeTicks,
  );

  return step === undefined
    ? (getMonthTicks({ end, start }) ?? getYearTicks({ end, start }))
    : getStepTicks({ end, start, step });
};
