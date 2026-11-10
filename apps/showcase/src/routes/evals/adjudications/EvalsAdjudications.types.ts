import type { readAdjudicationAccuracy } from '@repo/eval-history/adjudications/readAdjudicationAccuracy.service';
import type { readAdjudicationCases } from '@repo/eval-history/queries/readAdjudicationCases.service';
import type { readAdjudicationVerdicts } from '@repo/eval-history/queries/readAdjudicationVerdicts.service';

import type { loader } from './evals-adjudications.loader';
import type { scoredVerdicts } from './scoredVerdicts.util';

export type AccuracyViewRow = Awaited<
  ReturnType<typeof readAdjudicationAccuracy>
>[number];

export type AdjudicationAccuracyProps = Pick<
  AdjudicationsData,
  'accuracy' | 'heatmap' | 'prompts' | 'trend'
>;

export type AdjudicationCase = Awaited<
  ReturnType<typeof readAdjudicationCases>
>[number];

export type AdjudicationCasesProps = Pick<
  AdjudicationsData,
  'cases' | 'reopened'
>;

export type AdjudicationsData = Awaited<ReturnType<typeof loader>>;

export type AdjudicationSpendProps = Pick<
  AdjudicationsData,
  'builders' | 'costs' | 'rules'
>;

export type AdjudicationVerdict = Awaited<
  ReturnType<typeof readAdjudicationVerdicts>
>[number];

export type BuilderAccuracyRow = AdjudicationsData['builders'][number];

export type CaseRow = AdjudicationsData['cases']['rows'][number];

export type ModelAccuracyRow = AdjudicationsData['accuracy'][number];

export type ModelCostRow = AdjudicationsData['costs'][number];

export type PromptAccuracyRow = AdjudicationsData['prompts'][number];

export type RuleRateRow = AdjudicationsData['rules'][number];

export type ScoredVerdict = ReturnType<typeof scoredVerdicts>[number];

export type TrendModel = AdjudicationsData['trend'][number];
