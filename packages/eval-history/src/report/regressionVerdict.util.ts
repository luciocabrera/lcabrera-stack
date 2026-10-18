import type { RegressionConfig } from '../stats/stats.types.ts';
import type { ReportRun, RuleHistory } from './report.types.ts';

import { flakyListing } from './flakyListing.util.ts';
import { ruleVerdict } from './ruleVerdict.util.ts';

type RegressionVerdictArgs = {
  readonly a: ReportRun;
  readonly allowHarnessChange: boolean;
  readonly b: ReportRun;
  readonly config: RegressionConfig;
  readonly history: RuleHistory;
};

export const regressionVerdict = ({
  history,
  ...args
}: RegressionVerdictArgs) => {
  if (history.kind === 'needs-database') {
    return { flaky: [], rule: { kind: 'needs-database' } } as const;
  }

  return {
    flaky: flakyListing({ a: args.a, b: args.b, rows: history.flaky }),
    rule: ruleVerdict({
      ...args,
      baseline: history.baseline,
      flaky: history.flaky.map(({ taskKey }) => taskKey),
    }),
  } as const;
};
