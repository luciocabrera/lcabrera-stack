/**
 * The trigger confusion matrix: for each task's expectation, which skills its
 * trials actually loaded, so a failed trigger task names the skill that won.
 * Usage: imported by `verify-skill-triggers.mjs`.
 */
const NO_SKILL = '(none)';
const ERRORED = '(error)';
const CORNER = String.raw`expected \ loaded`;
const EMPTY_CELL = '.';

export const trialRecord = ({
  error,
  invoked,
  passed,
  skill,
  task,
  trial,
}) => ({
  error,
  invoked: [...new Set(invoked)],
  passed,
  set: task.set,
  shouldTrigger: task.shouldTrigger,
  skill,
  task: task.id,
  trial,
});

const expectedOf = ({ shouldTrigger, skill }) =>
  shouldTrigger ? skill : `not ${skill}`;

const loadedOf = ({ error, invoked }) => {
  if (invoked.length > 0) {
    return invoked;
  }
  return [error === undefined ? NO_SKILL : ERRORED];
};

const sorted = (names) => [...names].toSorted((a, b) => a.localeCompare(b));

const columnsOf = (trials) => {
  const loaded = new Set(trials.flatMap(loadedOf));
  return [
    ...sorted(
      [...loaded].filter((name) => name !== NO_SKILL && name !== ERRORED),
    ),
    ...[NO_SKILL, ERRORED].filter((name) => loaded.has(name)),
  ];
};

const rowOf = ({ columns, expected, trials }) => {
  const mine = trials.filter((trial) => expectedOf(trial) === expected);
  const counts = mine.flatMap(loadedOf).reduce((tally, name) => {
    tally[name] = (tally[name] ?? 0) + 1;
    return tally;
  }, {});
  return {
    cells: columns.map((column) => counts[column] ?? 0),
    expected,
    trials: mine.length,
  };
};

export const confusionMatrix = (trials) => {
  const columns = columnsOf(trials);
  const expectations = sorted(new Set(trials.map(expectedOf)));
  return {
    columns,
    rows: expectations.map((expected) => rowOf({ columns, expected, trials })),
  };
};

const cellText = (count) => (count === 0 ? EMPTY_CELL : String(count));

const padRow = ({ cells, widths }) =>
  cells
    .map((cell, index) =>
      index === 0 ? cell.padEnd(widths[index]) : cell.padStart(widths[index]),
    )
    .join('  ')
    .trimEnd();

export const formatMatrix = ({ columns, rows }) => {
  const table = [
    [CORNER, ...columns, 'trials'],
    ...rows.map(({ cells, expected, trials }) => [
      expected,
      ...cells.map(cellText),
      String(trials),
    ]),
  ];
  const widths = table[0].map((_, index) =>
    Math.max(...table.map((cells) => cells[index].length)),
  );
  return table.map((cells) => padRow({ cells, widths })).join('\n');
};
