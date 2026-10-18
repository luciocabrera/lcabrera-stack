import type { QueryClient } from '../queries/queries.types.ts';
import type { ReportRun } from './report.types.ts';

import { isBaselineSuite } from '../baseline/isBaselineSuite.util.ts';
import { readBaseline } from '../baseline/readBaseline.service.ts';

type ReadRuleBaselineArgs = {
  readonly client: QueryClient;
  readonly run: Pick<ReportRun, 'modelId' | 'suite'>;
};

export const readRuleBaseline = async ({
  client,
  run: { modelId, suite },
}: ReadRuleBaselineArgs) => {
  if (!isBaselineSuite(suite)) {
    return { kind: 'not-required' } as const;
  }

  const rows =
    modelId === undefined ? [] : await readBaseline({ client, modelId, suite });

  return { kind: 'rows', rows } as const;
};
