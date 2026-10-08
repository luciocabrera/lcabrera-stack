import type { TaskCount, TaskFlip } from './report.types.ts';

import { ABSENT_CELL } from './report.constants.ts';

type FlipTableArgs = {
  readonly flips: readonly TaskFlip[];
  readonly labels: { readonly a: string; readonly b: string };
};

const cell = (count: TaskCount | undefined) => {
  if (count === undefined) {
    return ABSENT_CELL;
  }

  const uncounted =
    count.excluded === 0 ? '' : ` (+${String(count.excluded)} not counted)`;

  return `${String(count.k)}/${String(count.n)}${uncounted}`;
};

export const flipTable = ({ flips, labels }: FlipTableArgs) =>
  flips.length === 0
    ? 'No task changed outcome.'
    : [
        `| Task | ${labels.a} | ${labels.b} |`,
        '| --- | --- | --- |',
        ...flips.map(
          ({ a, b, taskKey }) => `| ${taskKey} | ${cell(a)} | ${cell(b)} |`,
        ),
      ].join('\n');
