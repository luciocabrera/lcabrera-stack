import type { ReportRun } from './report.types.ts';

export const runReference = ({
  branch,
  gitSha,
  modelId,
  runId,
  suite,
}: ReportRun) => ({
  branch,
  gitSha,
  modelId,
  runId,
  suite,
});
