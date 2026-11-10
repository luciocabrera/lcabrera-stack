import type { ScoredVerdict } from './EvalsAdjudications.types';

import { HEAT_TONES } from '../heatmap/EvalsHeatmap.constants';
import { heatTone } from '../heatmap/heatTone.util';
import { accuracyLabel } from './accuracyLabel.util';
import { accuracyTally } from './accuracyTally.util';
import { ruleKey } from './ruleKey.util';

export const ruleHeatmap = (verdicts: readonly ScoredVerdict[]) => {
  const scored = verdicts.filter(({ isCorrect }) => isCorrect !== undefined);
  const columns = [
    ...new Map(
      scored.map((verdict) => [
        ruleKey(verdict),
        `${verdict.analyzer}: ${verdict.rule}`,
      ]),
    ),
  ]
    .toSorted(([left], [right]) => left.localeCompare(right))
    .map(([key, label]) => ({ key, label }));
  const rows = [...new Set(scored.map(({ model }) => model))]
    .toSorted((left, right) => left.localeCompare(right))
    .map((model) => ({ key: model, label: model }));
  const cells = rows
    .flatMap((model) =>
      columns.map((rule) => ({
        model,
        rule,
        tally: accuracyTally(
          scored.filter(
            (verdict) =>
              verdict.model === model.key && ruleKey(verdict) === rule.key,
          ),
        ),
      })),
    )
    .filter(({ tally }) => tally.scored > 0)
    .map(({ model, rule, tally }) => ({
      column: rule.key,
      label: `${model.label} on ${rule.label}: ${accuracyLabel(tally)}`,
      row: model.key,
      tone: HEAT_TONES[heatTone(tally.correct / tally.scored)],
    }));

  return {
    cells,
    columns,
    rows,
    title: `Accuracy of ${String(rows.length)} models over ${String(columns.length)} rules`,
  };
};
