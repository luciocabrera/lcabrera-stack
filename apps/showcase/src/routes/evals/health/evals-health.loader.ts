import {
  selectRunHealth,
  selectRunSummaries,
} from '../.server/evalsHistory.service';
import { requireEvalsDashboard } from '../.server/requireEvalsDashboard.service';
import { EVALS_HEALTH_RUNS } from '../constants/evalsDashboard.constants';
import { runFigures } from '../utils/runFigures.util';
import { runHealth } from './runHealth.util';

export const loader = async () => {
  requireEvalsDashboard();

  const summaries = await selectRunSummaries({
    scope: { kind: 'recent', perSuite: EVALS_HEALTH_RUNS },
  });
  const runs = summaries.map((run) => runFigures(run));
  const counts = await selectRunHealth({
    runIds: runs.map(({ runId }) => runId),
  });

  return { suites: runHealth({ counts, runs }) };
};
