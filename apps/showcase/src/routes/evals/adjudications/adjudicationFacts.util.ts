import type {
  AdjudicationCase,
  AdjudicationVerdict,
} from './EvalsAdjudications.types';

import { isAdversaryAlone } from './isAdversaryAlone.util';
import { verdictsByCase } from './verdictsByCase.util';

type AdjudicationFactsArgs = {
  readonly cases: readonly AdjudicationCase[];
  readonly verdicts: readonly AdjudicationVerdict[];
};

export const adjudicationFacts = ({
  cases,
  verdicts,
}: AdjudicationFactsArgs) => {
  const byCase = verdictsByCase(verdicts);
  const adversaryAlone = cases.filter(({ caseId }) =>
    isAdversaryAlone(byCase.get(caseId) ?? []),
  );
  const dismissed = cases.filter(({ outcome }) => outcome === 'dismissed');

  return [
    { term: 'Cases', value: String(cases.length) },
    {
      term: 'With a true answer',
      value: String(cases.filter(({ truth }) => truth !== undefined).length),
    },
    { term: 'Dismissed', value: String(dismissed.length) },
    {
      term: 'Reopened dismissals',
      value: String(
        dismissed.filter(({ truthSource }) => truthSource === 'reopened')
          .length,
      ),
    },
    {
      term: 'Only the adversary said REAL',
      value: String(adversaryAlone.length),
    },
    {
      term: 'Of those, REAL by the true answer',
      value: String(
        adversaryAlone.filter(({ truth }) => truth === 'REAL').length,
      ),
    },
  ];
};
