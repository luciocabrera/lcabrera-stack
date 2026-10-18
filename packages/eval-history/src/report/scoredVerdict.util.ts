import type { RegressionConfig } from '../stats/stats.types.ts';
import type {
  ReportRun,
  RuleFinding,
  ScoredBaselineRow,
} from './report.types.ts';

import { scoredRegression } from '../stats/scoredRegression.util.ts';
import { isTaskOfSubject } from './isTaskOfSubject.util.ts';
import { judgedBaselineRows } from './judgedBaselineRows.util.ts';
import { subjectKey } from './subjectKey.util.ts';

type ScoredVerdictArgs = {
  readonly allowHarnessChange: boolean;
  readonly b: ReportRun;
  readonly baseline: readonly ScoredBaselineRow[];
  readonly config: RegressionConfig;
  readonly flaky: readonly string[];
};

const UNRECORDED_HARNESS = '';

export const scoredVerdict = ({
  allowHarnessChange,
  b,
  baseline,
  config,
  flaky,
}: ScoredVerdictArgs) => {
  const subjects = [
    ...new Set(b.tasks.map(({ subject }) => subjectKey(subject))),
  ];
  const eligible = b.tasks.filter(
    ({ set, taskKey }) => set === 'regression' && !flaky.includes(taskKey),
  );
  const verdicts = judgedBaselineRows({
    baseline,
    subjects: new Set(subjects),
  }).map((row) => ({
    subject: row.subject,
    verdict: scoredRegression({
      allowHarnessChange,
      baseline: {
        identity: {
          harnessVersion: row.harnessVersion ?? UNRECORDED_HARNESS,
          modelId: row.modelId,
        },
        summary: {
          kind: 'summary',
          mean: row.mean,
          n: row.nRuns,
          stddev: row.stddev,
        },
      },
      config,
      pr: {
        identity: b,
        scores: eligible
          .filter((task) => isTaskOfSubject({ subject: row.subject, task }))
          .flatMap(({ scores }) => scores),
      },
    }),
  }));

  if (verdicts.length === 0) {
    return { kind: 'insufficient', unjudged: subjects } as const;
  }

  const incomparable = verdicts
    .map(({ verdict }) => verdict)
    .find((verdict) => verdict.kind === 'incomparable');

  if (incomparable !== undefined) {
    return incomparable;
  }

  const findings: readonly RuleFinding[] = verdicts.flatMap(
    ({ subject, verdict }) =>
      verdict.kind === 'regression'
        ? verdict.findings.map((finding) => ({ ...finding, subject }))
        : [],
  );

  if (findings.length > 0) {
    return { findings, kind: 'regression' } as const;
  }

  const unjudged = verdicts
    .filter(({ verdict }) => verdict.kind === 'insufficient')
    .map(({ subject }) =>
      subject === undefined ? b.suite : subjectKey(subject),
    );

  return unjudged.length === 0
    ? ({ kind: 'clear' } as const)
    : ({ kind: 'insufficient', unjudged } as const);
};
