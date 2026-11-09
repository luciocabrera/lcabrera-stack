import type { flakySuites } from './flakySuites.util';

export type FlakyRun = FlakySuite['runs'][number];

export type FlakyTaskRow = FlakySuite['tasks'][number] &
  Readonly<Record<string, unknown>>;

type FlakySuite = ReturnType<typeof flakySuites>[number];
