import type {
  RegressionConfig,
  RegressionFinding,
  RunIdentity,
  TaskTrials,
} from './stats.types.ts';

import { comparability } from './comparability.util.ts';
import { flipped } from './flipped.util.ts';
import { pooledRate } from './pooledRate.util.ts';

type BinaryRegressionArgs = {
  readonly allowHarnessChange?: boolean;
  readonly config: RegressionConfig;
  readonly flaky: readonly string[];
  readonly main: BinaryRun;
  readonly pr: BinaryRun;
};

type BinaryRun = {
  readonly identity: RunIdentity;
  readonly tasks: readonly TaskTrials[];
};

export const binaryRegression = ({
  allowHarnessChange,
  config,
  flaky,
  main,
  pr,
}: BinaryRegressionArgs) => {
  const comparison = comparability({
    allowHarnessChange,
    main: main.identity,
    pr: pr.identity,
  });

  if (comparison.kind === 'incomparable') {
    return comparison;
  }

  const eligible = (tasks: readonly TaskTrials[]) =>
    tasks.filter(
      ({ set, taskKey }) => set === 'regression' && !flaky.includes(taskKey),
    );
  const mainTasks = eligible(main.tasks);
  const prTasks = eligible(pr.tasks);
  const mainRate = pooledRate({ config, tasks: mainTasks });
  const prRate = pooledRate({ config, tasks: prTasks });
  const isRateDropped =
    mainRate.kind === 'rate' &&
    prRate.kind === 'rate' &&
    prRate.rate < mainRate.lower;
  const taskVerdicts = prTasks
    .map((task) =>
      flipped({ flip: config.binary.flip, main: mainTasks, pr: task }),
    )
    .filter((verdict) => verdict !== undefined);
  const findings: readonly RegressionFinding[] = [
    ...(isRateDropped
      ? [{ kind: 'rate', main: mainRate, pr: prRate } as const]
      : []),
    ...taskVerdicts.filter((verdict) => verdict.kind === 'flip'),
  ];

  if (findings.length > 0) {
    return { findings, kind: 'regression' } as const;
  }

  const unjudged = taskVerdicts
    .filter(({ kind }) => kind === 'insufficient')
    .map(({ taskKey }) => taskKey);

  return mainRate.kind === 'rate' &&
    prRate.kind === 'rate' &&
    unjudged.length === 0
    ? ({ kind: 'clear' } as const)
    : ({ kind: 'insufficient', unjudged } as const);
};
