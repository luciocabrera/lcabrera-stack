import type { RunEnvelope } from '../envelope/envelope.types.ts';
import type {
  BaselineMetric,
  BaselineSubject,
  SubjectMeasure,
} from './baseline.types.ts';

import { countOutcomes } from '../stats/countOutcomes.util.ts';

type IsSameSubjectArgs = {
  readonly candidate: BaselineSubject | undefined;
  readonly subject: BaselineSubject;
};

type SubjectMeasuresArgs = {
  readonly envelope: RunEnvelope;
  readonly metric: BaselineMetric;
};

type Trials = RunEnvelope['trials'];

const passRate = (trials: Trials) => {
  const { k, n } = countOutcomes(trials.map(({ outcome }) => outcome));

  return n === 0 ? undefined : k / n;
};

const qualityOverall = (trials: Trials) => {
  const scores = trials
    .filter(({ outcome }) => outcome === 'pass')
    .map(({ detail }) => detail)
    .filter((detail) => detail.schema === 'quality/1')
    .map(({ overall }) => overall);

  return scores.length === 0
    ? undefined
    : scores.reduce((sum, score) => sum + score, 0) / scores.length;
};

const MEASURE_BY_METRIC = {
  pass_rate: passRate,
  quality_overall: qualityOverall,
} as const satisfies Record<
  BaselineMetric,
  (trials: Trials) => number | undefined
>;

const isSameSubject = ({ candidate, subject }: IsSameSubjectArgs) =>
  candidate?.kind === subject.kind && candidate.name === subject.name;

export const subjectMeasures = ({ envelope, metric }: SubjectMeasuresArgs) => {
  const measure = MEASURE_BY_METRIC[metric];
  const subjectOfTask = new Map(
    envelope.tasks.map(({ subject, task_key }) => [task_key, subject]),
  );
  const trialsOf = (subject: BaselineSubject) =>
    envelope.trials.filter(({ task_key }) =>
      isSameSubject({ candidate: subjectOfTask.get(task_key), subject }),
    );
  const suiteMeasure: SubjectMeasure = {
    subject: undefined,
    value: measure(envelope.trials),
  };

  return [
    suiteMeasure,
    ...envelope.subjects.map(({ kind, name }) => ({
      subject: { kind, name },
      value: measure(trialsOf({ kind, name })),
    })),
  ];
};
