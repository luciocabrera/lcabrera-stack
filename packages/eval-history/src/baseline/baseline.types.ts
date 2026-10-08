import type { RunEnvelope } from '../envelope/envelope.types.ts';
import type {
  BASELINE_METRICS,
  BASELINE_SUITES,
} from './baseline.constants.ts';

export type BaselineMetric = (typeof BASELINE_METRICS)[number];

export type BaselineRow = {
  readonly baselineId: string;
  readonly gitSha: string;
  readonly mean: number;
  readonly metric: BaselineMetric;
  readonly modelId: string;
  readonly nRuns: number;
  readonly stddev: number;
  readonly subject: BaselineSubject | undefined;
  readonly suite: BaselineSuite;
};

export type BaselineSubject = RunEnvelope['tasks'][number]['subject'];

export type BaselineSuite = (typeof BASELINE_SUITES)[number];

export type SubjectMeasure = {
  readonly subject: BaselineSubject | undefined;
  readonly value: number | undefined;
};
