import type { Rgb, Rgba } from './tests.types';

type CompositeOverSurfaceArgs = {
  readonly color: Rgba;
  readonly surface: Rgb;
};

export const compositeOverSurface = ({
  color: { alpha, rgb },
  surface,
}: CompositeOverSurfaceArgs) => {
  const blend = (index: 0 | 1 | 2) =>
    alpha * rgb[index] + (1 - alpha) * surface[index];

  return [blend(0), blend(1), blend(2)] as const;
};
