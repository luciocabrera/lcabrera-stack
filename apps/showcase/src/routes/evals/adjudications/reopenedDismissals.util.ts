import type { AdjudicationCase } from './EvalsAdjudications.types';

export const reopenedDismissals = (cases: readonly AdjudicationCase[]) =>
  cases
    .filter(
      ({ outcome, truthSource }) =>
        outcome === 'dismissed' && truthSource === 'reopened',
    )
    .map(({ analyzer, caseId, createdAt, rule }) => ({
      caseId,
      label: `${caseId}: ${analyzer} ${rule}, dismissed by the panel on ${createdAt.toISOString().slice(0, 10)}, then reopened as REAL`,
    }));
