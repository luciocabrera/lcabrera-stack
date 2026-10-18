import type { readTriggerConfusion } from '@repo/eval-history/queries/readTriggerConfusion.service';

import { EMPTY_CELL, ERRORED, NO_SKILL } from './EvalsConfusion.constants';

type ConfusionRow = Awaited<ReturnType<typeof readTriggerConfusion>>[number];

const UNLOADED = [NO_SKILL, ERRORED];

const expectationOf = ({ expectedSkill, taskKind }: ConfusionRow) =>
  taskKind === 'trigger' ? expectedSkill : `not ${expectedSkill}`;

const loadedOf = ({ errored, invoked }: ConfusionRow) =>
  new Set(invoked.length > 0 ? invoked : [errored ? ERRORED : NO_SKILL]);

type IsMisloadArgs = {
  readonly column: string;
  readonly row: ConfusionRow;
};

const isMisload = ({ column, row }: IsMisloadArgs) => {
  if (UNLOADED.includes(column)) {
    return row.taskKind === 'trigger' && column === NO_SKILL;
  }

  return row.taskKind === 'trigger'
    ? column !== row.expectedSkill
    : column === row.expectedSkill;
};

export const confusionMatrix = (rows: readonly ConfusionRow[]) => {
  const loaded = new Set(rows.flatMap((row) => [...loadedOf(row)]));
  const columns = [
    ...[...loaded]
      .filter((name) => !UNLOADED.includes(name))
      .toSorted((left, right) => left.localeCompare(right)),
    ...UNLOADED.filter((name) => loaded.has(name)),
  ];
  const expectations = [
    ...new Set(rows.map((row) => expectationOf(row))),
  ].toSorted((left, right) => left.localeCompare(right));

  return {
    columns,
    rows: expectations.map((expected) => {
      const mine = rows
        .filter((row) => expectationOf(row) === expected)
        .map((row) => ({ loadedSkills: loadedOf(row), row }));

      return {
        cells: columns.map((column) => {
          const counted = mine
            .filter(({ loadedSkills }) => loadedSkills.has(column))
            .map(({ row }) => row);
          const count = counted.reduce((sum, { trials }) => sum + trials, 0);

          return {
            column,
            count,
            isMisload: counted.some((row) => isMisload({ column, row })),
            label: count === 0 ? EMPTY_CELL : String(count),
          };
        }),
        expected,
        trials: mine.reduce((sum, { row }) => sum + row.trials, 0),
      };
    }),
  };
};
