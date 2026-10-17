import type { TaskFlip } from './report.types.ts';

import { flipCell } from './flipCell.util.ts';

type FlipTableArgs = {
  readonly flips: readonly TaskFlip[];
  readonly labels: { readonly a: string; readonly b: string };
};

export const flipTable = ({ flips, labels }: FlipTableArgs) =>
  flips.length === 0
    ? 'No task changed outcome.'
    : [
        `| Task | ${labels.a} | ${labels.b} |`,
        '| --- | --- | --- |',
        ...flips.map(
          ({ a, b, taskKey }) =>
            `| ${taskKey} | ${flipCell(a)} | ${flipCell(b)} |`,
        ),
      ].join('\n');
