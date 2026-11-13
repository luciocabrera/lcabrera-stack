import type { ChartDensity } from '../ChartSettings.types';

import { CHART_DENSITY_SCALE } from '../ChartSettings.constants';

type ScaleByDensityArgs = {
  readonly density: ChartDensity;
  readonly size: number;
};

export const scaleByDensity = ({ density, size }: ScaleByDensityArgs) =>
  Math.round(size * CHART_DENSITY_SCALE[density]);
