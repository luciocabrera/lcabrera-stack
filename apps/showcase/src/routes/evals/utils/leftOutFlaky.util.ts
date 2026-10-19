import type { Regression } from '@repo/eval-history/report/report.types';

type LeftOutTask = {
  readonly disagreeing: number;
  readonly runs: number;
  readonly taskKey: string;
};

export const leftOutFlaky = ({ flaky }: Pick<Regression, 'flaky'>) => {
  const listed: readonly LeftOutTask[] = flaky;

  return listed.map(({ disagreeing, runs, taskKey }) => ({
    disagreeing,
    runs,
    taskKey,
  }));
};
