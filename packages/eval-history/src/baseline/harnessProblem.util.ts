import type { RunEnvelope } from '../envelope/envelope.types.ts';

import { sessionLimitProblem } from './sessionLimitProblem.util.ts';

export const harnessProblem = (envelope: RunEnvelope) => {
  const { run, trials } = envelope;
  const limited = sessionLimitProblem(envelope);

  if (limited !== undefined) {
    return limited;
  }
  if (run.status !== 'complete') {
    return `run ${run.run_id} is ${run.status}, so its runner stopped before it finished`;
  }
  if (trials.length === 0) {
    return `run ${run.run_id} recorded no trials`;
  }

  return trials.every(({ outcome }) => outcome === 'error')
    ? `every trial of run ${run.run_id} ended in error, which points at the harness rather than the model`
    : undefined;
};
