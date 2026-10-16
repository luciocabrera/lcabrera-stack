import type { SubjectRun } from '@repo/eval-history/queries/queries.types';

import { evalsHref } from '../utils/evalsHref.util';
import { passRateLabel } from '../utils/passRateLabel.util';
import { rateFigures } from '../utils/rateFigures.util';

export const trendPoints = (runs: readonly SubjectRun[]) =>
  runs
    .filter(({ n }) => n > 0)
    .toReversed()
    .map((run) => {
      const figures = rateFigures(run);

      return {
        contentHash: run.contentHash,
        href: evalsHref({ runId: run.runId, trialId: run.trialId }),
        key: run.runId,
        label: `${run.suite} run ${run.runId.slice(0, 8)}, ${run.startedAt.toISOString().slice(0, 10)}: ${passRateLabel(figures)}; open trial ${run.trialId}`,
        lower: figures.lower,
        modelId: run.modelId,
        startedAt: run.startedAt.toISOString(),
        upper: figures.upper,
        value: figures.rate ?? 0,
      };
    });
