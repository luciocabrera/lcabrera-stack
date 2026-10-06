import type { IngestReport, IngestResult } from './ingest.types.ts';

import { ingestLogLine } from './ingestLogLine.util.ts';
import { unsentWarning } from './unsentWarning.util.ts';

type IngestSummaryArgs = {
  readonly database: string;
  readonly missing: readonly string[];
  readonly quietUnreachable: boolean;
  readonly reports: readonly IngestReport[];
};

const FAILING_RESULTS = new Set<IngestResult>([
  'conflict',
  'failed',
  'rejected',
]);

export const ingestSummary = (args: IngestSummaryArgs) => {
  const { database, missing, quietUnreachable, reports } = args;
  const failed =
    missing.length > 0 ||
    reports.some(({ result }) => FAILING_RESULTS.has(result));
  const unreachable = reports.some(({ result }) => result === 'unsent');

  return {
    exitCode: failed || (unreachable && !quietUnreachable) ? 1 : 0,
    stderr: [
      ...(missing.length === 0 && reports.length === 0
        ? ['evals:ingest: no envelopes found']
        : []),
      ...missing.map(
        (target) => `evals:ingest: no such file or directory: ${target}`,
      ),
      ...unsentWarning(args),
    ],
    stdout: reports.map((report) => ingestLogLine({ database, report })),
  };
};
