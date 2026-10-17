import type { SubjectRun } from '@repo/eval-history/queries/queries.types';

import { evalsHref } from '../utils/evalsHref.util';
import { subjectHref } from '../utils/subjectHref.util';
import { heatmapCell } from './heatmapCell.util';

type HeatmapGridsArgs = {
  readonly cells: readonly SubjectRun[];
  readonly flaky: readonly {
    readonly suite: string;
    readonly taskKey: string;
  }[];
};

export const heatmapGrids = ({ cells, flaky }: HeatmapGridsArgs) => {
  const flakyTasks = new Set(
    flaky.map(({ suite, taskKey }) => `${suite}\n${taskKey}`),
  );
  const drawn = cells.map((cell) => ({
    ...heatmapCell({ cell, flakyTasks }),
    source: cell,
  }));
  const suites = [...new Set(cells.map(({ suite }) => suite))].toSorted(
    (left, right) => left.localeCompare(right),
  );

  return suites.map((suite) => {
    const suiteCells = drawn.filter(({ source }) => source.suite === suite);
    const byKey = new Map(suiteCells.map((cell) => [cell.key, cell]));
    const runs = [
      ...new Map(
        suiteCells
          .map(({ source }) => source)
          .toSorted(
            (left, right) =>
              left.startedAt.getTime() - right.startedAt.getTime(),
          )
          .map(({ runId, startedAt }) => [runId, startedAt.toISOString()]),
      ),
    ].map(([runId, startedAt]) => ({
      href: evalsHref({ runId }),
      label: `Run ${runId.slice(0, 8)}, ${startedAt.slice(0, 10)}`,
      runId,
    }));
    const subjects = [
      ...new Map(
        suiteCells.map(({ source }) => [
          `${source.subjectKind}/${source.subjectName}`,
          { kind: source.subjectKind, name: source.subjectName },
        ]),
      ),
    ].toSorted(([left], [right]) => left.localeCompare(right));

    return {
      runs,
      subjects: subjects.map(([key, subject]) => ({
        cells: runs.map(({ runId }) => {
          const cell = byKey.get(`${key}/${runId}`);

          return cell === undefined
            ? undefined
            : {
                href: cell.href,
                isFlaky: cell.isFlaky,
                key: cell.key,
                label: cell.label,
                tone: cell.tone,
              };
        }),
        href: subjectHref(subject),
        key,
        label: subject.name,
      })),
      suite,
    };
  });
};
