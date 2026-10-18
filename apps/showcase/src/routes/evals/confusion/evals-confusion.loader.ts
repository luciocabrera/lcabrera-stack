import type { LoaderFunctionArgs } from 'react-router';

import {
  selectRunSummaries,
  selectTriggerConfusion,
} from '../.server/evalsHistory.service';
import { requireEvalsDashboard } from '../.server/requireEvalsDashboard.service';
import { requireStoredRun } from '../.server/requireStoredRun.service';
import { EVALS_CONFUSION_RUNS } from '../constants/evalsDashboard.constants';
import { runFigures } from '../utils/runFigures.util';
import { runWhenLabel } from '../utils/runWhenLabel.util';
import { confusionMatrix } from './confusionMatrix.util';
import { confusionSelection } from './confusionSelection.util';
import { CONFUSION_SUITE } from './EvalsConfusion.constants';

const NOT_FOUND = () => new Response('Not Found', { status: 404 });

const selectedRuns = async (
  selection: ReturnType<typeof confusionSelection>,
) => {
  if (selection.kind === 'recent') {
    return;
  }

  const run = await requireStoredRun(selection.runId);

  if (run.suite !== CONFUSION_SUITE) {
    throw NOT_FOUND();
  }

  return [runFigures(run)];
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  requireEvalsDashboard();

  const selection = confusionSelection(new URL(request.url).searchParams);
  const [recent, picked] = await Promise.all([
    selectRunSummaries({
      scope: { kind: 'recent', perSuite: EVALS_CONFUSION_RUNS },
    }),
    selectedRuns(selection),
  ]);
  const choices = recent
    .filter(({ suite }) => suite === CONFUSION_SUITE)
    .map((run) => runFigures(run));
  const runs = picked ?? choices;
  const rows = await selectTriggerConfusion({
    runIds: runs.map(({ runId }) => runId),
  });

  return {
    choices: choices.map((run) => ({
      label: runWhenLabel(run),
      runId: run.runId,
    })),
    matrix: confusionMatrix(rows),
    runs: runs.map((run) => ({ label: runWhenLabel(run), runId: run.runId })),
    selectedRunId: picked?.[0]?.runId,
  };
};
