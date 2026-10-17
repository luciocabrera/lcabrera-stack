import { attribute } from '@repo/eval-history/stats/attribute.util';

import type { RunComparisonRow, RunInputs } from './EvalsCompare.types';

import { runInputHashes } from './runInputHashes.util';
import { taskInputHashes } from './taskInputHashes.util';

type ChangedInputsArgs = {
  readonly a: RunInputs;
  readonly b: RunInputs;
  readonly rows: readonly RunComparisonRow[];
};

export const changedInputs = ({ a, b, rows }: ChangedInputsArgs) =>
  attribute({
    after: { ...runInputHashes(b), ...taskInputHashes({ rows, side: 'B' }) },
    before: { ...runInputHashes(a), ...taskInputHashes({ rows, side: 'A' }) },
  });
