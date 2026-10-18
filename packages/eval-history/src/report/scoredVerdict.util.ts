import type { BaselineRow } from '../baseline/baseline.types.ts';
import type { RegressionConfig } from '../stats/stats.types.ts';
import type {
  ReportRun,
  ReportTask,
  RuleFinding,
  TaskSubject,
} from './report.types.ts';

import { scoredRegression } from '../stats/scoredRegression.util.ts';
import { subjectKey } from './subjectKey.util.ts';

type IsOfSubjectArgs = {
  readonly subject: TaskSubject | undefined;
  readonly task: Pick<ReportTask, 'subject'>;
};

type JudgedRowsArgs = {
  readonly baseline: readonly ScoredBaselineRow[];
  readonly subjects: ReadonlySet<string>;
};

type ScoredBaselineRow = Pick<
  BaselineRow,
  'mean' | 'modelId' | 'nRuns' | 'stddev' | 'subject'
> & {
  readonly harnessVersion: null | string;
};

type ScoredVerdictArgs = {
  readonly allowHarnessChange: boolean;
  readonly b: ReportRun;
  readonly baseline: readonly ScoredBaselineRow[];
  readonly config: RegressionConfig;
  readonly flaky: readonly string[];
};

const UNRECORDED_HARNESS = '';

const judgedRows = ({ baseline, subjects }: JudgedRowsArgs) => {
  const perSubject = baseline.filter(
    ({ subject }) => subject !== undefined && subjects.has(subjectKey(subject)),
  );
  const subjectRows = baseline.filter(({ subject }) => subject !== undefined);
  const isEverySubjectJudged = perSubject.length === subjectRows.length;

  return [
    ...(isEverySubjectJudged
      ? baseline.filter(({ subject }) => subject === undefined)
      : []),
    ...perSubject,
  ];
};

const isOfSubject = ({ subject, task }: IsOfSubjectArgs) =>
  subject === undefined || subjectKey(task.subject) === subjectKey(subject);

export const scoredVerdict = ({
  allowHarnessChange,
  b,
  baseline,
  config,
  flaky,
}: ScoredVerdictArgs) => {
  const eligible = b.tasks.filter(
    ({ set, taskKey }) => set === 'regression' && !flaky.includes(taskKey),
  );
  const verdicts = judgedRows({
    baseline,
    subjects: new Set(b.tasks.map(({ subject }) => subjectKey(subject))),
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
          .filter((task) => isOfSubject({ subject: row.subject, task }))
          .flatMap(({ scores }) => scores),
      },
    }),
  }));
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
