import type { QueryClient } from '../queries/queries.types.ts';
import type { RegressionConfig } from '../stats/stats.types.ts';
import type { ReportRun } from './report.types.ts';

import { readFlakyTasks } from '../queries/readFlakyTasks.service.ts';
import { readRuleBaseline } from './readRuleBaseline.service.ts';

type ReadRuleHistoryArgs = {
  readonly client: QueryClient | undefined;
  readonly config: RegressionConfig;
  readonly run: Pick<ReportRun, 'modelId' | 'suite'>;
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
    baseline: await readRuleBaseline({ client, run }),
    flaky: flaky.filter(({ suite }) => suite === run.suite),
    kind: 'read',
  } as const;
};
