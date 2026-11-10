import type { AdjudicationVerdict } from './EvalsAdjudications.types';

export const panelTally = (verdicts: readonly AdjudicationVerdict[]) =>
  verdicts.length === 0
    ? 'no verdict'
    : [...new Set(verdicts.map(({ verdict }) => verdict))]
        .toSorted((left, right) => left.localeCompare(right))
        .map(
          (verdict) =>
            `${String(verdicts.filter((seat) => seat.verdict === verdict).length)} ${verdict}`,
        )
        .join(', ');
