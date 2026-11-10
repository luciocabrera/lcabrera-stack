import type {
  ChartMarker,
  LineSeries,
} from '@lcabrera/ui/components/LineChart';

import type { SubjectTrendSeriesProps } from './EvalsSubjectTrend.types';

import { MARK_TONES } from './EvalsSubjectTrend.constants';

export const trendChartSeries = ({
  marks,
  points,
  suite,
}: SubjectTrendSeriesProps['series']) => {
  const markers: readonly ChartMarker[] = marks.map(
    ({ kind, label, startedAt }) => ({
      label,
      tone: MARK_TONES[kind],
      x: new Date(startedAt),
    }),
  );
  const line: LineSeries = {
    band: points.flatMap(({ lower, startedAt, upper }) =>
      lower === undefined || upper === undefined
        ? []
        : [{ lower, upper, x: new Date(startedAt) }],
    ),
    id: suite,
    label: 'Pass rate',
    points: points.map(({ href, label, startedAt, value }) => ({
      label,
      to: href,
      x: new Date(startedAt),
      y: value,
    })),
  };

  return { line, markers };
};
