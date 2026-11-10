import type { AdjudicationVerdict } from './EvalsAdjudications.types';

export const isAdversaryAlone = (seats: readonly AdjudicationVerdict[]) => {
  const adversaries = seats.filter(({ role }) => role === 'adversary');
  const judges = seats.filter(({ role }) => role === 'judge');

  return (
    adversaries.length > 0 &&
    judges.length > 0 &&
    adversaries.every(({ verdict }) => verdict === 'REAL') &&
    judges.every(({ verdict }) => verdict === 'FALSE_POSITIVE')
  );
};
