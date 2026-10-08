import type { SUITES } from '../envelope/envelope.constants.ts';
import type { readEnvelopeFile } from '../ingest/readEnvelopeFile.service.ts';
import type { QueryClient } from '../queries/queries.types.ts';
import type { Outcome, Rate } from '../stats/stats.types.ts';
import type { compareRuns } from './compareRuns.util.ts';

export type ReadEnvelope = (
  file: string,
) => ReturnType<typeof readEnvelopeFile>;

export type ReportConnection = {
  readonly client: QueryClient;
  readonly end: () => Promise<void>;
};

export type ReportRun = {
  readonly branch: string;
  readonly catalogHash?: string;
  readonly costUsdReported?: number;
  readonly durationsMs: readonly number[];
  readonly gitSha: string;
  readonly harnessVersion: string;
  readonly modelId?: string;
  readonly runId: string;
  readonly status: 'aborted' | 'complete' | 'partial';
  readonly subjects: readonly ReportSubject[];
  readonly suite: Suite;
  readonly tasks: readonly ReportTask[];
};

export type ReportSubject = {
  readonly contentHash: string;
  readonly kind: string;
  readonly name: string;
};

export type ReportTask = {
  readonly agentPromptHash?: string;
  readonly expectedHash?: string;
  readonly fixtureHash?: string;
  readonly judgePromptHash?: string;
  readonly outcomes: readonly Outcome[];
  readonly taskHash: string;
  readonly taskKey: string;
};

export type RunComparison = ReturnType<typeof compareRuns>;

export type RunSide = {
  readonly branch: string;
  readonly costUsdReported?: number;
  readonly durationP50Ms?: number;
  readonly excluded: number;
  readonly gitSha: string;
  readonly modelId?: string;
  readonly rate: Rate;
  readonly runId: string;
  readonly status: ReportRun['status'];
};

export type Suite = (typeof SUITES)[number];

export type TaskCount = {
  readonly excluded: number;
  readonly k: number;
  readonly n: number;
};

export type TaskFlip = {
  readonly a?: TaskCount;
  readonly b?: TaskCount;
  readonly taskKey: string;
};

export type Thresholds = {
  readonly minTrialsForRate: number;
  readonly z: number;
};
