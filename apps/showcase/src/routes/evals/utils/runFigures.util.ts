import type { RunSummary } from '@repo/eval-history/queries/queries.types';

import { rateFigures } from './rateFigures.util';

export const runFigures = (run: RunSummary) => ({
  ...run,
  ...rateFigures(run),
  durationMs: run.finishedAt.getTime() - run.startedAt.getTime(),
  finishedAt: run.finishedAt.toISOString(),
  startedAt: run.startedAt.toISOString(),
});
