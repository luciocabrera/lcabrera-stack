import type { ChartDomain, ChartRange } from './chart.types';

type ScaleLinearArgs = {
  readonly domain: ChartDomain;
  readonly isClamped?: boolean;
  readonly range: ChartRange;
};

export const scaleLinear = ({
  domain,
  isClamped = false,
  range,
}: ScaleLinearArgs) => {
  const [start, end] = domain;
  const [from, to] = range;
  const span = end - start;

  return (value: number) => {
    if (span === 0) return (from + to) / 2;

    const ratio = (value - start) / span;
    const bounded = isClamped ? Math.min(Math.max(ratio, 0), 1) : ratio;

    return from + bounded * (to - from);
  };
};
