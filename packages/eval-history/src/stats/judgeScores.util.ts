import type { RunEnvelope } from '../envelope/envelope.types.ts';

export const judgeScores = (trials: RunEnvelope['trials']) =>
  trials
    .filter(({ outcome }) => outcome === 'pass')
    .map(({ detail }) => detail)
    .filter((detail) => detail.schema === 'quality/1')
    .map(({ overall }) => overall);
