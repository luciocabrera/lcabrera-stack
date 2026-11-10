import type { AdjudicationVerdict } from './EvalsAdjudications.types';

import { costLabel } from '../utils/costLabel.util';
import { durationLabel } from '../utils/durationLabel.util';
import { summedCost } from './summedCost.util';

export const modelCosts = (verdicts: readonly AdjudicationVerdict[]) =>
  [...new Set(verdicts.map(({ model }) => model))]
    .toSorted((left, right) => left.localeCompare(right))
    .map((model) => {
      const seats = verdicts.filter((verdict) => verdict.model === model);
      const costs = seats.map(({ costUsd }) => costUsd);
      const total = summedCost(costs);
      const priced = costs.filter((cost) => cost !== undefined).length;

      return {
        cases: new Set(seats.map(({ caseId }) => caseId)).size,
        cost: costLabel(total),
        costPerVerdict: costLabel(
          total === undefined ? undefined : total / priced,
        ),
        duration: durationLabel(
          seats.reduce((sum, { durationMs }) => sum + durationMs, 0) /
            seats.length,
        ),
        id: model,
        model,
        tokensIn: seats.reduce((sum, { tokensIn }) => sum + tokensIn, 0),
        tokensOut: seats.reduce((sum, { tokensOut }) => sum + tokensOut, 0),
        verdicts: seats.length,
      };
    });
