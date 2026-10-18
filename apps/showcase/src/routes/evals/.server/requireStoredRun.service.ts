import { isRunId } from '../utils/isRunId.util';
import { selectRunSummaries } from './evalsHistory.service';
import { requireEvalsDashboard } from './requireEvalsDashboard.service';

export const requireStoredRun = async (runId: string | undefined) => {
  requireEvalsDashboard();

  if (!isRunId(runId)) {
    throw new Response('Not Found', { status: 404 });
  }

  const [run] = await selectRunSummaries({
    scope: { kind: 'run', runId },
  });

  if (run === undefined) {
    throw new Response('Not Found', { status: 404 });
  }

  return run;
};
