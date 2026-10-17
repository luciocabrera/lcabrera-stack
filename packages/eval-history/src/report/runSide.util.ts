import type { ReportRun, Thresholds } from './report.types.ts';

import { countOutcomes } from '../stats/countOutcomes.util.ts';
import { wilson } from '../stats/wilson.util.ts';
import { medianOf } from './medianOf.util.ts';

type RunSideArgs = {
  readonly run: ReportRun;
  readonly thresholds: Thresholds;
};

export const runSide = ({ run, thresholds }: RunSideArgs) => {
  const { excluded, k, n } = countOutcomes(
    run.tasks.flatMap(({ outcomes }) => outcomes),
  );

  return {
    branch: run.branch,
    costUsdReported: run.costUsdReported,
    durationP50Ms: medianOf(run.durationsMs),
    excluded,
    gitSha: run.gitSha,
    modelId: run.modelId,
    rate: wilson({ k, minN: thresholds.minTrialsForRate, n, z: thresholds.z }),
    runId: run.runId,
    status: run.status,
  };
};
