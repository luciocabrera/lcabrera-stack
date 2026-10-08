import type { RunEnvelope } from '../envelope/envelope.types.ts';

import { isBaselineSuite } from './isBaselineSuite.util.ts';

const excluded = (reason: string) => ({ kind: 'excluded', reason }) as const;

export const baselineRun = (envelope: RunEnvelope) => {
  const { baseline_id, git_dirty, model_id, run_id, status, suite } =
    envelope.run;

  if (baseline_id === null) {
    return excluded(`run ${run_id} belongs to no baseline`);
  }
  if (status !== 'complete') {
    return excluded(`run ${run_id} is ${status}, so it is left out`);
  }
  if (git_dirty) {
    return excluded(`run ${run_id} ran on a dirty tree, so it is left out`);
  }
  if (model_id === null || !isBaselineSuite(suite)) {
    return excluded(
      `run ${run_id} is a ${suite} run, which calls no model and has no baseline`,
    );
  }

  return {
    baselineId: baseline_id,
    envelope,
    gitSha: envelope.run.git_sha,
    kind: 'run',
    modelId: model_id,
    suite,
  } as const;
};
