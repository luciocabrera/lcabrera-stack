import { isTableDensity } from '#ui/components/Table/utils/isTableDensity.util';

import type { ChartChoiceKey } from '../ChartSettings.types';

import { CHART_POINTS_OPTIONS } from '../ChartSettings.constants';

type ToChartChoicePatchArgs = {
  readonly key: ChartChoiceKey;
  readonly value: string;
};

export const toChartChoicePatch = ({ key, value }: ToChartChoicePatchArgs) => {
  if (key === 'density') return isTableDensity(value) ? { density: value } : {};

  if (key === 'points') {
    const option = CHART_POINTS_OPTIONS.find((point) => point.value === value);

    return option === undefined ? {} : { points: option.value };
  }

  const count = Number(value);

  if (!Number.isSafeInteger(count) || count <= 0) return {};

  return key === 'axisLabelStep'
    ? { axisLabelStep: count }
    : { tickCount: count };
};
