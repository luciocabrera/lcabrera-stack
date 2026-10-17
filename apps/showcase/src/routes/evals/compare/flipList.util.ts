import type { RunComparisonRow } from './EvalsCompare.types';

import { flipChange } from './flipChange.util';
import { taskTally } from './taskTally.util';
import { taskVerdict } from './taskVerdict.util';

const ORDER = { changed: 2, improved: 1, regressed: 0 } as const;

export const flipList = (rows: readonly RunComparisonRow[]) =>
  rows
    .map((row) => ({
      after: taskVerdict({ k: row.kB, n: row.nB }),
      before: taskVerdict({ k: row.kA, n: row.nA }),
      row,
    }))
    .filter(({ after, before }) => after !== before)
    .map(({ after, before, row }) => ({
      a: taskTally({ k: row.kA, n: row.nA, outcomes: row.outcomesA }),
      b: taskTally({ k: row.kB, n: row.nB, outcomes: row.outcomesB }),
      change: flipChange({ after, before }),
      id: `${row.suite}/${row.taskKey}`,
      subjectKind: row.subjectKind,
      subjectName: row.subjectName,
      taskKey: row.taskKey,
    }))
    .toSorted(
      (left, right) =>
        ORDER[left.change] - ORDER[right.change] ||
        left.id.localeCompare(right.id),
    );
