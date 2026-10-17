import type { RunEnvelope } from '../envelope/envelope.types.ts';

import { SESSION_LIMIT_ERROR_CLASS } from '../envelope/envelope.constants.ts';

export const sessionLimitProblem = ({ run, trials }: RunEnvelope) =>
  trials.some(({ error_class }) => error_class === SESSION_LIMIT_ERROR_CLASS)
    ? `run ${run.run_id} was cut off by the session limit`
    : undefined;
