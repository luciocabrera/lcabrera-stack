import type { Regression } from '@repo/eval-history/report/report.types';

import type { JudgedRunPair } from './EvalsOverview.types';

import { leftOutFlaky } from '../utils/leftOutFlaky.util';

type RegressedPair = JudgedRunPair & {
  readonly verdict: Regression & {
    readonly rule: Extract<Regression['rule'], { readonly kind: 'regression' }>;
  };
};

const isRegressed = (pair: JudgedRunPair): pair is RegressedPair =>
  pair.verdict.rule.kind === 'regression';

export const suiteRegressions = (pairs: readonly JudgedRunPair[]) =>
  pairs
    .filter((pair) => isRegressed(pair))
    .map(({ latest, previous, suite, verdict }) => ({
      findings: verdict.rule.findings,
      flakyLeftOut: leftOutFlaky(verdict).map(({ taskKey }) => taskKey),
      latest,
      previous,
      suite,
    }));
