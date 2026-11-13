import {
  TABLE_DENSITY_LABELS,
  TABLE_DENSITY_LEVELS,
} from '#ui/components/Table/Table.constants';

import type {
  ChartChoiceKey,
  ChartChoiceOption,
  ChartSettingsValues,
} from '../ChartSettings.types';

import {
  CHART_AXIS_LABEL_STEP_OPTIONS,
  CHART_CHOICE_TITLES,
  CHART_POINTS_OPTIONS,
  CHART_TICK_COUNT_OPTIONS,
} from '../ChartSettings.constants';

type Candidate = {
  readonly key: ChartChoiceKey;
  readonly options: readonly ChartChoiceOption[];
  readonly value: string | undefined;
};

const DENSITY_OPTIONS = TABLE_DENSITY_LEVELS.map((value) => ({
  label: TABLE_DENSITY_LABELS[value],
  value,
}));

export const toChartChoiceSections = ({
  axisLabelStep,
  density,
  points,
  tickCount,
}: ChartSettingsValues) => {
  const candidates: readonly Candidate[] = [
    { key: 'density', options: DENSITY_OPTIONS, value: density },
    { key: 'points', options: CHART_POINTS_OPTIONS, value: points },
    {
      key: 'axisLabelStep',
      options: CHART_AXIS_LABEL_STEP_OPTIONS,
      value: axisLabelStep?.toString(),
    },
    {
      key: 'tickCount',
      options: CHART_TICK_COUNT_OPTIONS,
      value: tickCount?.toString(),
    },
  ];

  return candidates
    .filter(
      (candidate): candidate is Candidate & { readonly value: string } =>
        candidate.value !== undefined,
    )
    .map((candidate) => ({
      ...candidate,
      title: CHART_CHOICE_TITLES[candidate.key],
    }));
};
