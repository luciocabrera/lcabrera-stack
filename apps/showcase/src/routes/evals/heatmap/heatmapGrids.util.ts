import type { SubjectRun } from '@repo/eval-history/queries/queries.types';

import { evalsHref } from '../utils/evalsHref.util';
import { subjectHref } from '../utils/subjectHref.util';
import { heatmapCell, subjectKey } from './heatmapCell.util';

type HeatmapGridsArgs = {
  readonly cells: readonly SubjectRun[];
  readonly flaky: readonly {
    readonly suite: string;
    readonly taskKey: string;
  }[];
};

const suiteColumns = (cells: readonly SubjectRun[]) =>
  [
    ...new Map(
      cells
        .toSorted(
          (left, right) => left.startedAt.getTime() - right.startedAt.getTime(),
        )
        .map(({ runId, startedAt }) => [runId, startedAt.toISOString()]),
    ),
  ].map(([runId, startedAt]) => ({
    key: runId,
    label: `Run ${runId.slice(0, 8)}, ${startedAt.slice(0, 10)}`,
    to: evalsHref({ runId }),
  }));

const suiteRows = (cells: readonly SubjectRun[]) =>
  [
    ...new Map(
      cells.map((cell) => [
        subjectKey(cell),
        { kind: cell.subjectKind, name: cell.subjectName },
      ]),
    ),
  ]
    .toSorted(([left], [right]) => left.localeCompare(right))
    .map(([key, subject]) => ({
      key,
      label: subject.name,
      to: subjectHref(subject),
    }));

export const heatmapGrids = ({ cells, flaky }: HeatmapGridsArgs) => {
  const flakyTasks = new Set(
    flaky.map(({ suite, taskKey }) => `${suite}\n${taskKey}`),
  );

  return [...new Set(cells.map(({ suite }) => suite))]
    .toSorted((left, right) => left.localeCompare(right))
    .map((suite) => {
      const suiteCells = cells.filter((cell) => cell.suite === suite);
      const columns = suiteColumns(suiteCells);
      const rows = suiteRows(suiteCells);

      return {
        cells: suiteCells.map((cell) => heatmapCell({ cell, flakyTasks })),
        columns,
        rows,
        suite,
        title: `${suite}: ${String(rows.length)} subjects over ${String(columns.length)} runs`,
      };
    });
};
