import type { RegressionConfig } from '../stats/stats.types.ts';
import type { ReportRun, RuleHistory } from './report.types.ts';

import { BASELINE_METRIC_BY_SUITE } from '../baseline/baseline.constants.ts';
import { isBaselineSuite } from '../baseline/isBaselineSuite.util.ts';
import { binaryVerdict } from './binaryVerdict.util.ts';
import { flakyListing } from './flakyListing.util.ts';
import { scoredVerdict } from './scoredVerdict.util.ts';

type ReadHistory = Extract<RuleHistory, { readonly kind: 'read' }>;

type RegressionVerdictArgs = {
  readonly a: ReportRun;
  readonly allowHarnessChange: boolean;
  readonly b: ReportRun;
  readonly config: RegressionConfig;
  readonly history: RuleHistory;
};

type RuleArgs = Omit<RegressionVerdictArgs, 'history'> & {
  readonly flaky: readonly string[];
  readonly history: ReadHistory;
};

const isScored = (suite: ReportRun['suite']) =>
  isBaselineSuite(suite) &&
  BASELINE_METRIC_BY_SUITE[suite] === 'quality_overall';

const rule = ({
  a,
  allowHarnessChange,
  b,
  config,
  flaky,
  history,
}: RuleArgs) => {
  const { baseline } = history;

  if (baseline.kind === 'rows' && baseline.rows.length === 0) {
    return { kind: 'no-baseline', modelId: b.modelId } as const;
  }

  return isScored(b.suite)
    ? scoredVerdict({
        allowHarnessChange,
        b,
        baseline: baseline.kind === 'rows' ? baseline.rows : [],
        config,
        flaky,
      })
    : binaryVerdict({ a, allowHarnessChange, b, config, flaky });
};

export const regressionVerdict = ({
  history,
  ...args
}: RegressionVerdictArgs) => {
  if (history.kind === 'needs-database') {
    return { flaky: [], rule: { kind: 'needs-database' } } as const;
  }

  const flaky = flakyListing({ a: args.a, b: args.b, rows: history.flaky });

  return {
    flaky,
    rule: rule({
      ...args,
      flaky: history.flaky.map(({ taskKey }) => taskKey),
      history,
    }),
  } as const;
};
