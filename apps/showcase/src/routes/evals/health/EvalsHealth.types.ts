import type { loader } from './evals-health.loader';

export type HealthClassRow = HealthSuiteProps['suite']['classes'][number];

export type HealthRunRow = HealthSuiteProps['suite']['troubled'][number];

export type HealthSuiteProps = {
  readonly suite: Awaited<ReturnType<typeof loader>>['suites'][number];
};
