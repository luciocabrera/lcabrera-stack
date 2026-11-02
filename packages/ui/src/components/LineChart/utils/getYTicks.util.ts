import { niceTicks } from '@lcabrera/utils/chart/nice-ticks.util';

import { LINE_CHART } from '#ui/components/LineChart/LineChart.constants';

type GetYTicksArgs = {
  readonly domain: readonly [number, number];
  readonly ticks?: readonly number[];
};

export const getYTicks = ({ domain, ticks }: GetYTicksArgs) =>
  ticks ??
  niceTicks({ count: LINE_CHART.tickCount, max: domain[1], min: domain[0] });
