import type {
  AccuracyViewRow,
  AdjudicationCase,
  AdjudicationVerdict,
} from './EvalsAdjudications.types';

import { accuracyRows } from './accuracyRows.util';
import { accuracyTrend } from './accuracyTrend.util';
import { adjudicationFacts } from './adjudicationFacts.util';
import { builderAccuracy } from './builderAccuracy.util';
import { caseRows } from './caseRows.util';
import { modelCosts } from './modelCosts.util';
import { promptAccuracy } from './promptAccuracy.util';
import { reopenedDismissals } from './reopenedDismissals.util';
import { ruleHeatmap } from './ruleHeatmap.util';
import { ruleRates } from './ruleRates.util';
import { scoredVerdicts } from './scoredVerdicts.util';

type AdjudicationsViewArgs = {
  readonly accuracy: readonly AccuracyViewRow[];
  readonly cases: readonly AdjudicationCase[];
  readonly verdicts: readonly AdjudicationVerdict[];
};

export const adjudicationsView = ({
  accuracy,
  cases,
  verdicts,
}: AdjudicationsViewArgs) => {
  const scored = scoredVerdicts({ cases, verdicts });

  return {
    accuracy: accuracyRows(accuracy),
    builders: builderAccuracy({ cases, verdicts: scored }),
    cases: caseRows({ cases, verdicts }),
    costs: modelCosts(verdicts),
    facts: adjudicationFacts({ cases, verdicts }),
    heatmap: ruleHeatmap(scored),
    prompts: promptAccuracy(scored),
    reopened: reopenedDismissals(cases),
    rules: ruleRates(cases),
    trend: accuracyTrend(scored),
  };
};
