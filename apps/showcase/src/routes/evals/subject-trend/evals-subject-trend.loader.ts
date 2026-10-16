import type { LoaderFunctionArgs } from 'react-router';

import {
  selectAnnotations,
  selectSubjectRuns,
} from '../.server/evalsHistory.service';
import { requireEvalsDashboard } from '../.server/requireEvalsDashboard.service';
import { EVALS_TREND_RUNS } from '../constants/evalsDashboard.constants';
import { isSubjectKind } from '../utils/isSubjectKind.util';
import { trendMarks } from './trendMarks.util';
import { trendPoints } from './trendPoints.util';

export const loader = async ({ params }: LoaderFunctionArgs) => {
  requireEvalsDashboard();

  const { kind, name } = params;

  if (name === undefined || name === '' || !isSubjectKind(kind)) {
    throw new Response('Not Found', { status: 404 });
  }

  const runs = await selectSubjectRuns({
    scope: {
      kind: 'subject',
      limit: EVALS_TREND_RUNS,
      subjectKind: kind,
      subjectName: name,
    },
  });
  const newest = runs.at(0);
  const oldest = runs.at(-1);

  if (newest === undefined || oldest === undefined) {
    throw new Response('Not Found', { status: 404 });
  }

  const annotations = await selectAnnotations({
    from: oldest.startedAt,
    to: newest.startedAt,
  });
  const points = trendPoints(runs);

  return {
    kind,
    marks: trendMarks({
      annotations: annotations.map((annotation) => ({
        ...annotation,
        at: annotation.at.toISOString(),
      })),
      points,
    }),
    name,
    points,
    runs: runs.length,
  };
};
