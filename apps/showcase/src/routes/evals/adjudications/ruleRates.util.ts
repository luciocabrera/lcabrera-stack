import type { AdjudicationCase } from './EvalsAdjudications.types';

import { accuracyLabel } from './accuracyLabel.util';
import { ruleKey } from './ruleKey.util';

export const ruleRates = (cases: readonly AdjudicationCase[]) =>
  [
    ...new Map(
      cases.map(({ analyzer, rule }) => [
        ruleKey({ analyzer, rule }),
        { analyzer, rule },
      ]),
    ),
  ]
    .map(([key, { analyzer, rule }]) => {
      const ruleCases = cases.filter(
        (adjudicated) => ruleKey(adjudicated) === key,
      );
      const answered = ruleCases.filter(({ truth }) => truth !== undefined);
      const falsePositives = answered.filter(
        ({ truth }) => truth === 'FALSE_POSITIVE',
      ).length;
      return {
        analyzer,
        answered: answered.length,
        cases: ruleCases.length,
        dismissed: ruleCases.filter(({ outcome }) => outcome === 'dismissed')
          .length,
        falsePositives,
        id: key,
        rate: accuracyLabel({
          correct: falsePositives,
          scored: answered.length,
        }),
        reopened: ruleCases.filter(
          ({ truthSource }) => truthSource === 'reopened',
        ).length,
        rule,
      };
    })
    .toSorted(
      (left, right) =>
        right.cases - left.cases || left.id.localeCompare(right.id),
    );
