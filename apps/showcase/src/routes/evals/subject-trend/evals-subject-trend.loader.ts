import type { LoaderFunctionArgs } from 'react-router';

import {
  selectAnnotations,
  selectSubjectRuns,
} from '../.server/evalsHistory.service';
import { requireEvalsDashboard } from '../.server/requireEvalsDashboard.service';
import { EVALS_TREND_RUNS } from '../constants/evalsDashboard.constants';
import { isSubjectKind } from '../utils/isSubjectKind.util';
import { trendSeries } from './trendSeries.util';

export const loader = async ({ params }: LoaderFunctionArgs) => {
  requireEvalsDashboard();

  const { kind, name } = params;

  if (name === undefined || name === '' || !isSubjectKind(kind)) {
    throw new Response('Not Found', { status: 404 });
  }

  const runs = await selectSubjectRuns({
    scope: {
      kind: 'subject',
      perSuite: EVALS_TREND_RUNS,
      subjectKind: kind,
      subjectName: name,
    },
  });
  const times = runs.map(({ startedAt }) => startedAt.getTime());

  if (times.length === 0) {
    throw new Response('Not Found', { status: 404 });
  }

  const annotations = await selectAnnotations({
    from: new Date(Math.min(...times)),
    to: new Date(Math.max(...times)),
  });

  return {
    kind,
    name,
    series: trendSeries({
      annotations: annotations.map((annotation) => ({
        ...annotation,
        at: annotation.at.toISOString(),
      })),
      runs,
    }),
  };
};
