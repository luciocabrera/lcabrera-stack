import { niceTicks } from '@lcabrera/utils/chart/nice-ticks.util';

import { LINE_CHART } from '#ui/components/LineChart/LineChart.constants';

type GetYTicksArgs = {
  readonly domain: readonly [number, number];
  readonly tickCount?: number;
  readonly ticks?: readonly number[];
};

export const getYTicks = ({
  domain,
  tickCount = LINE_CHART.tickCount,
  ticks,
}: GetYTicksArgs) =>
  ticks ?? niceTicks({ count: tickCount, max: domain[1], min: domain[0] });
