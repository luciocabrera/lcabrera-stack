import type { AdjudicationVerdict } from './EvalsAdjudications.types';

export const verdictsByCase = (verdicts: readonly AdjudicationVerdict[]) =>
  verdicts.reduce((byCase, verdict) => {
    byCase.set(verdict.caseId, [
      ...(byCase.get(verdict.caseId) ?? []),
      verdict,
    ]);

    return byCase;
  }, new Map<string, readonly AdjudicationVerdict[]>());
