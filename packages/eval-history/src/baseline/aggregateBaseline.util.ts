import type { RunEnvelope } from '../envelope/envelope.types.ts';
import type {
  BaselineRow,
  BaselineSubject,
  SubjectMeasure,
} from './baseline.types.ts';

import { MIN_BASELINE_RUNS } from '../stats/stats.constants.ts';
import { summarize } from '../stats/summarize.util.ts';
import { BASELINE_METRIC_BY_SUITE } from './baseline.constants.ts';
import { baselineRun } from './baselineRun.util.ts';
import { subjectMeasures } from './subjectMeasures.util.ts';

type Aggregate = {
  readonly problems: readonly string[];
  readonly rows: readonly BaselineRow[];
};

type BaselineRun = Extract<ReturnType<typeof baselineRun>, { kind: 'run' }>;

type SubjectValues = {
  readonly subject: BaselineSubject | undefined;
  readonly values: number[];
};

const subjectKey = (subject: BaselineSubject | undefined) =>
  subject === undefined ? '' : `${subject.kind}/${subject.name}`;

const subjectLabel = (subject: BaselineSubject | undefined) =>
  subject === undefined
    ? 'the suite as a whole'
    : `${subject.kind} ${subject.name}`;

const distinct = (values: readonly string[]) => [...new Set(values)];

const valuesBySubject = (measures: readonly SubjectMeasure[]) =>
  measures.reduce((bySubject, { subject, value }) => {
    const key = subjectKey(subject);
    const entry = bySubject.get(key) ?? { subject, values: [] };

    if (value !== undefined) {
      entry.values.push(value);
    }

    return bySubject.set(key, entry);
  }, new Map<string, SubjectValues>());

const mixedProblem = (runs: readonly [BaselineRun, ...BaselineRun[]]) => {
  const [first] = runs;
  const spans = [
    ['suites', distinct(runs.map(({ suite }) => suite))],
    ['models', distinct(runs.map(({ modelId }) => modelId))],
    ['commits', distinct(runs.map(({ gitSha }) => gitSha))],
  ] as const;
  const mixed = spans.filter(([, values]) => values.length > 1);

  return mixed.length === 0
    ? undefined
    : `baseline ${first.baselineId} spans ${mixed
        .map(([label, values]) => `${label} ${values.join(', ')}`)
        .join('; ')}, so it records nothing`;
};

const groupAggregate = (runs: readonly [BaselineRun, ...BaselineRun[]]) => {
  const [first] = runs;
  const metric = BASELINE_METRIC_BY_SUITE[first.suite];
  const bySubject = valuesBySubject(
    runs.flatMap(({ envelope }) => subjectMeasures({ envelope, metric })),
  );

  return bySubject.values().reduce<Aggregate>(
    ({ problems, rows }, { subject, values }) => {
      const summary = summarize(values);

      return summary.kind === 'insufficient'
        ? {
            problems: [
              ...problems,
              `${subjectLabel(subject)} has a counted result in ${String(summary.n)} of ${String(runs.length)} runs; a baseline needs ${String(MIN_BASELINE_RUNS)}`,
            ],
            rows,
          }
        : {
            problems,
            rows: [
              ...rows,
              {
                baselineId: first.baselineId,
                gitSha: first.gitSha,
                mean: summary.mean,
                metric,
                modelId: first.modelId,
                nRuns: summary.n,
                stddev: summary.stddev,
                subject,
                suite: first.suite,
              },
            ],
          };
    },
    { problems: [], rows: [] },
  );
};

const groupResult = (runs: readonly [BaselineRun, ...BaselineRun[]]) => {
  const problem = mixedProblem(runs);

  return problem === undefined
    ? groupAggregate(runs)
    : { problems: [problem], rows: [] };
};

const runsByBaseline = (runs: readonly BaselineRun[]) =>
  runs.reduce((byBaseline, run) => {
    const group = byBaseline.get(run.baselineId);

    if (group === undefined) {
      return byBaseline.set(run.baselineId, [run]);
    }

    group.push(run);

    return byBaseline;
  }, new Map<string, [BaselineRun, ...BaselineRun[]]>());

export const aggregateBaseline = (envelopes: readonly RunEnvelope[]) => {
  const classified = envelopes.map((envelope) => baselineRun(envelope));
  const runs = classified.filter((entry) => entry.kind === 'run');
  const exclusions = classified
    .filter((entry) => entry.kind === 'excluded')
    .map(({ reason }) => reason);
  const groups = runsByBaseline(runs)
    .values()
    .map((group) => groupResult(group))
    .toArray();

  return {
    problems: [...exclusions, ...groups.flatMap(({ problems }) => problems)],
    rows: groups.flatMap(({ rows }) => rows),
  };
};
