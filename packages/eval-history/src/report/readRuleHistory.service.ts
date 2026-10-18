import type { QueryClient } from '../queries/queries.types.ts';
import type { RegressionConfig } from '../stats/stats.types.ts';
import type { ReportRun } from './report.types.ts';

import { isBaselineSuite } from '../baseline/isBaselineSuite.util.ts';
import { readBaseline } from '../baseline/readBaseline.service.ts';
import { readFlakyTasks } from '../queries/readFlakyTasks.service.ts';

type ReadBaselineRowsArgs = Omit<ReadRuleHistoryArgs, 'client' | 'config'> & {
  readonly client: QueryClient;
};

type ReadRuleHistoryArgs = {
  readonly client: QueryClient | undefined;
  readonly config: RegressionConfig;
  readonly run: Pick<ReportRun, 'modelId' | 'suite'>;
};

const readBaselineRows = async ({
  client,
  run: { modelId, suite },
}: ReadBaselineRowsArgs) => {
  if (!isBaselineSuite(suite)) {
    return { kind: 'not-required' } as const;
  }

  const rows =
    modelId === undefined ? [] : await readBaseline({ client, modelId, suite });

  return { kind: 'rows', rows } as const;
};

export const readRuleHistory = async ({
  client,
  config,
  run,
}: ReadRuleHistoryArgs) => {
  if (client === undefined) {
    return { kind: 'needs-database' } as const;
  }

  const flaky = await readFlakyTasks({
    client,
    disagreeFraction: config.flaky.disagreeFraction,
    window: config.flaky.window,
  });

  return {
    baseline: await readBaselineRows({ client, run }),
    flaky: flaky.filter(({ suite }) => suite === run.suite),
    kind: 'read',
  } as const;
};
