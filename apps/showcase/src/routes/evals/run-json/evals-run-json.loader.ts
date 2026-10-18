import type { LoaderFunctionArgs } from 'react-router';

import { runProjection } from '@repo/eval-history/queries/runProjection.util';

import {
  selectRunJudgeScores,
  selectRunTrials,
} from '../.server/evalsHistory.service';
import { requireStoredRun } from '../.server/requireStoredRun.service';

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const run = await requireStoredRun(params.runId);
  const { runId } = run;
  const [trials, scores] = await Promise.all([
    selectRunTrials({ limit: run.trials, offset: 0, runId, sorting: [] }),
    selectRunJudgeScores({ runId }),
  ]);

  return Response.json(runProjection({ run, scores, trials: trials.data }), {
    headers: { 'Access-Control-Allow-Origin': '*' },
  });
};
