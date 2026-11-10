import type {
  AdjudicationCase,
  ScoredVerdict,
} from './EvalsAdjudications.types';

import { accuracyLabel } from './accuracyLabel.util';
import { accuracyTally } from './accuracyTally.util';
import { UNRECORDED_BUILDER } from './EvalsAdjudications.constants';

type BuilderAccuracyArgs = {
  readonly cases: readonly AdjudicationCase[];
  readonly verdicts: readonly ScoredVerdict[];
};

export const builderAccuracy = ({ cases, verdicts }: BuilderAccuracyArgs) =>
  [
    ...new Set(
      cases.map(({ builderModel }) => builderModel ?? UNRECORDED_BUILDER),
    ),
  ]
    .toSorted((left, right) => left.localeCompare(right))
    .map((builder) => {
      const built = cases.filter(
        ({ builderModel }) => (builderModel ?? UNRECORDED_BUILDER) === builder,
      );
      const caseIds = new Set(built.map(({ caseId }) => caseId));

      return {
        accuracy: accuracyLabel(
          accuracyTally(verdicts.filter(({ caseId }) => caseIds.has(caseId))),
        ),
        builder,
        cases: built.length,
        dismissed: built.filter(({ outcome }) => outcome === 'dismissed')
          .length,
        id: builder,
      };
    });
