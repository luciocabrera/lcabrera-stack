import type { RegressionConfig } from '../stats/stats.types.ts';
import type { ReportRun, RuleFinding } from './report.types.ts';

import { binaryRegression } from '../stats/binaryRegression.util.ts';

type BinaryVerdictArgs = {
  readonly a: ReportRun;
  readonly allowHarnessChange: boolean;
  readonly b: ReportRun;
  readonly config: RegressionConfig;
  readonly flaky: readonly string[];
};

export const binaryVerdict = ({
  a,
  allowHarnessChange,
  b,
  config,
  flaky,
}: BinaryVerdictArgs) => {
  const verdict = binaryRegression({
    allowHarnessChange,
    config,
    flaky,
    main: { identity: a, tasks: a.tasks },
    pr: { identity: b, tasks: b.tasks },
  });

  if (verdict.kind !== 'regression') {
    return verdict;
  }

  const subjectOf = new Map(
    b.tasks.map(({ subject, taskKey }) => [taskKey, subject]),
  );

  const findings: readonly RuleFinding[] = verdict.findings.map((finding) =>
    finding.kind === 'rate'
      ? finding
      : {
          ...finding,
          subject:
            finding.kind === 'flip'
              ? subjectOf.get(finding.taskKey)
              : undefined,
        },
  );

  return { findings, kind: 'regression' } as const;
};
