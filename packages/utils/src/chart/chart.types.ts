export type ChartBandPoint<X extends ChartValue = number> = {
  readonly lower?: null | number;
  readonly upper?: null | number;
  readonly x: X;
};

export type ChartDomain<T extends ChartValue = number> = readonly [T, T];

export type ChartPoint<X extends ChartValue = number> = {
  readonly x: X;
  readonly y?: null | number;
};

export type ChartRange = readonly [number, number];

export type ChartScale<T extends ChartValue = number> = (value: T) => number;

export type ChartValue = Date | number;
