import type { ReportRun, Thresholds } from './report.types.ts';

import { attribute } from '../stats/attribute.util.ts';
import { runHashes } from './runHashes.util.ts';
import { runSide } from './runSide.util.ts';
import { taskFlips } from './taskFlips.util.ts';

type CompareRunsArgs = {
  readonly a: ReportRun;
  readonly allowModelChange?: boolean;
  readonly b: ReportRun;
  readonly thresholds: Thresholds;
};

const runReference = ({
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

const refusalReason = ({
  a,
  allowModelChange,
  b,
}: Omit<CompareRunsArgs, 'thresholds'>) => {
  if (a.suite !== b.suite) {
    return 'suite-mismatch';
  }

  return allowModelChange || a.modelId === b.modelId
    ? undefined
    : 'model-changed';
};

export const compareRuns = ({
  a,
  allowModelChange = false,
  b,
  thresholds,
}: CompareRunsArgs) => {
  const reason = refusalReason({ a, allowModelChange, b });

  if (reason !== undefined) {
    return {
      a: runReference(a),
      b: runReference(b),
      kind: 'refused',
      reason,
      suite: b.suite,
    } as const;
  }

  return {
    a: runSide({ run: a, thresholds }),
    b: runSide({ run: b, thresholds }),
    changed: attribute({ after: runHashes(b), before: runHashes(a) }),
    flips: taskFlips({ a, b }),
    kind: 'comparison',
    suite: b.suite,
    thresholds,
  } as const;
};
