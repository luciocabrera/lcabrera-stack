import type { SubjectRun } from '@repo/eval-history/queries/queries.types';

import { trendMarks } from './trendMarks.util';
import { trendPoints } from './trendPoints.util';

type TrendSeriesArgs = {
  readonly annotations: Parameters<typeof trendMarks>[0]['annotations'];
  readonly runs: readonly SubjectRun[];
};

export const trendSeries = ({ annotations, runs }: TrendSeriesArgs) =>
  [...new Set(runs.map(({ suite }) => suite))]
    .toSorted((left, right) => left.localeCompare(right))
    .map((suite) => {
      const suiteRuns = runs
        .filter((run) => run.suite === suite)
        .toSorted(
          (left, right) => right.startedAt.getTime() - left.startedAt.getTime(),
        );
      const points = trendPoints(suiteRuns);

      return {
        marks: trendMarks({ annotations, points }),
        points,
        runs: suiteRuns.length,
        suite,
      };
    });
