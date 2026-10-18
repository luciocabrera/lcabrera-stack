import type { RegressionConfig } from '../stats/stats.types.ts';
import type { ReportRun, RuleHistory } from './report.types.ts';

import { binaryVerdict } from './binaryVerdict.util.ts';
import { isScoredSuite } from './isScoredSuite.util.ts';
import { scoredVerdict } from './scoredVerdict.util.ts';

type RuleVerdictArgs = {
  readonly a: ReportRun;
  readonly allowHarnessChange: boolean;
  readonly b: ReportRun;
  readonly baseline: Extract<
    RuleHistory,
    { readonly kind: 'read' }
  >['baseline'];
  readonly config: RegressionConfig;
  readonly flaky: readonly string[];
};

export const ruleVerdict = ({
  a,
  allowHarnessChange,
  b,
  baseline,
  config,
  flaky,
}: RuleVerdictArgs) => {
  if (baseline.kind === 'rows' && baseline.rows.length === 0) {
    return { kind: 'no-baseline', modelId: b.modelId } as const;
  }

  return isScoredSuite(b.suite)
    ? scoredVerdict({
        allowHarnessChange,
        b,
        baseline: baseline.kind === 'rows' ? baseline.rows : [],
        config,
        flaky,
      })
    : binaryVerdict({ a, allowHarnessChange, b, config, flaky });
};
