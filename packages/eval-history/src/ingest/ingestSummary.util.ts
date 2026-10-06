import type { IngestReport, IngestResult } from './ingest.types.ts';

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

type LogLineArgs = {
  readonly database: string;
  readonly report: IngestReport;
};

const logLine = ({ database, report }: LogLineArgs) =>
  JSON.stringify({
    database,
    duration_ms: report.durationMs,
    event: 'evals.ingest',
    file: report.file,
    problems: report.problems,
    result: report.result,
    rows: report.rows,
    run_id: report.runId,
    suite: report.suite,
  });

const unsentWarning = ({ database, reports }: IngestSummaryArgs) => {
  const unsent = reports.filter(({ result }) => result === 'unsent');

  return unsent.length === 0
    ? []
    : [
        `evals:ingest: ${database} is unreachable; ${String(unsent.length)} envelope(s) stay on disk until \`vp run evals:ingest\` sends them`,
      ];
};

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
    stdout: reports.map((report) => logLine({ database, report })),
  };
};
