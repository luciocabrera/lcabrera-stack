import type { ChartDomain, ChartRange } from './chart.types';

import { scaleLinear } from './scale-linear.util';

type ScaleTimeArgs = {
  readonly domain: ChartDomain<Date>;
  readonly isClamped?: boolean;
  readonly range: ChartRange;
};

export const scaleTime = ({
  domain,
  isClamped = false,
  range,
}: ScaleTimeArgs) => {
  const [start, end] = domain;
  const scale = scaleLinear({
    domain: [start.getTime(), end.getTime()],
    isClamped,
    range,
  });

  return (value: Date) => scale(value.getTime());
};
