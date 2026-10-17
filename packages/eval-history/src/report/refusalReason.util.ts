import type { ReportRun } from './report.types.ts';

type RefusalReasonArgs = {
  readonly a: ReportRun;
  readonly allowModelChange: boolean;
  readonly b: ReportRun;
};

export const refusalReason = ({
  a,
  allowModelChange,
  b,
}: RefusalReasonArgs) => {
  if (a.suite !== b.suite) {
    return 'suite-mismatch';
  }

  return allowModelChange || a.modelId === b.modelId
    ? undefined
    : 'model-changed';
};
