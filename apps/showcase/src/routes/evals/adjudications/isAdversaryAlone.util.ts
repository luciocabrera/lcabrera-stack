import type { AdjudicationVerdict } from './EvalsAdjudications.types';

export const isAdversaryAlone = (seats: readonly AdjudicationVerdict[]) =>
  seats.some(({ role }) => role === 'adversary') &&
  seats.some(({ role }) => role === 'judge') &&
  seats.every(
    ({ role, verdict }) =>
      verdict === (role === 'adversary' ? 'REAL' : 'FALSE_POSITIVE'),
  );
