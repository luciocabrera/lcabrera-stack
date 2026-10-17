import type { RunComparisonRow } from './EvalsCompare.types';

type TaskInputHashesArgs = {
  readonly rows: readonly RunComparisonRow[];
  readonly side: 'A' | 'B';
};

export const taskInputHashes = ({ rows, side }: TaskInputHashesArgs) =>
  Object.fromEntries(
    rows
      .filter(({ nA, nB }) => nA !== undefined && nB !== undefined)
      .flatMap((row) => [
        [
          `${row.subjectKind} ${row.subjectName} content`,
          row[`contentHash${side}`],
        ],
        [`${row.taskKey} task`, row[`taskHash${side}`]],
        [`${row.taskKey} fixture`, row[`fixtureHash${side}`]],
        [`${row.taskKey} expected result`, row[`expectedHash${side}`]],
        [`${row.taskKey} judge prompt`, row[`judgePromptHash${side}`]],
        [`${row.taskKey} agent prompt`, row[`agentPromptHash${side}`]],
      ]),
  );
