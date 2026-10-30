import type { IngestReport } from './ingest.types.ts';

type IngestLogLineArgs = {
  readonly database: string;
  readonly report: IngestReport;
};

export const ingestLogLine = ({ database, report }: IngestLogLineArgs) =>
  JSON.stringify({
    case_id: report.caseId,
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
