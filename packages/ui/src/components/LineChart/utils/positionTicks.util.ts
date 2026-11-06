import { roundToCents } from '@lcabrera/utils/numbers/round-to-cents.util';

import type { ChartX } from '#ui/components/LineChart/LineChart.types';

import { isWithinPlot } from './isWithinPlot.util';

type PositionTicksArgs<T extends ChartX> = {
  readonly format: (value: T) => string;
  readonly scale: (value: T) => number;
  readonly ticks: readonly T[];
};

export const positionTicks = <T extends ChartX>({
  format,
  scale,
  ticks,
}: PositionTicksArgs<T>) =>
  ticks
    .map((value) => ({
      at: roundToCents(scale(value)),
      key: String(Number(value)),
      text: format(value),
    }))
    .filter(({ at }) => isWithinPlot(at));
