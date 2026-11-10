import type {
  AdjudicationCase,
  AdjudicationVerdict,
} from './EvalsAdjudications.types';

import { verdictsByCase } from './verdictsByCase.util';

type ScoredVerdictsArgs = {
  readonly cases: readonly AdjudicationCase[];
  readonly verdicts: readonly AdjudicationVerdict[];
};

export const scoredVerdicts = ({ cases, verdicts }: ScoredVerdictsArgs) => {
  const byCase = verdictsByCase(verdicts);

  return cases.flatMap((adjudicated) =>
    (byCase.get(adjudicated.caseId) ?? []).map((verdict) => ({
      ...verdict,
      analyzer: adjudicated.analyzer,
      builderModel: adjudicated.builderModel,
      createdAt: adjudicated.createdAt,
      isCorrect:
        adjudicated.truth === undefined
          ? undefined
          : verdict.verdict === adjudicated.truth,
      rule: adjudicated.rule,
    })),
  );
};
