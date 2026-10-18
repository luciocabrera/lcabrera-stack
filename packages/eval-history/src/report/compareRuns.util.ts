import type { RegressionConfig } from '../stats/stats.types.ts';
import type { ReportRun, RuleHistory } from './report.types.ts';

import { attribute } from '../stats/attribute.util.ts';
import { refusalReason } from './refusalReason.util.ts';
import { regressionVerdict } from './regressionVerdict.util.ts';
import { runHashes } from './runHashes.util.ts';
import { runReference } from './runReference.util.ts';
import { runSide } from './runSide.util.ts';
import { sharedRun } from './sharedRun.util.ts';
import { taskFlips } from './taskFlips.util.ts';

type CompareRunsArgs = {
  readonly a: ReportRun;
  readonly allowHarnessChange?: boolean;
  readonly allowModelChange?: boolean;
  readonly b: ReportRun;
  readonly history: RuleHistory;
  readonly thresholds: RegressionConfig;
};

export const compareRuns = ({
  a,
  allowHarnessChange = false,
  allowModelChange = false,
  b,
  history,
  thresholds,
}: CompareRunsArgs) => {
  const reason = refusalReason({ a, allowModelChange, b });
  const regression = () =>
    regressionVerdict({
      a,
      allowHarnessChange,
      b,
      config: thresholds,
      history,
    });

  if (reason !== undefined) {
    return {
      a: runReference(a),
      b: runReference(b),
      kind: 'refused',
      reason,
      regression: reason === 'model-changed' ? regression() : undefined,
      suite: b.suite,
    } as const;
  }

  return {
    a: runSide({ run: a, thresholds }),
    b: runSide({ run: b, thresholds }),
    changed: attribute({
      after: runHashes(sharedRun({ other: a, run: b })),
      before: runHashes(sharedRun({ other: b, run: a })),
    }),
    flips: taskFlips({ a, b }),
    kind: 'comparison',
    regression: regression(),
    suite: b.suite,
    thresholds: {
      minTrialsForRate: thresholds.minTrialsForRate,
      z: thresholds.z,
    },
  } as const;
};
