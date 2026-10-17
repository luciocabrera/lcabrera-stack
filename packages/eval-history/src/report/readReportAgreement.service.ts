import type { QueryClient } from '../queries/queries.types.ts';
import type { Thresholds } from './report.types.ts';

import { judgeAgreement } from '../grades/judgeAgreement.util.ts';
import { readJudgeAgreement } from '../grades/readJudgeAgreement.service.ts';

type ReadReportAgreementArgs = {
  readonly client: QueryClient | undefined;
  readonly thresholds: Thresholds;
};

export const readReportAgreement = async ({
  client,
  thresholds,
}: ReadReportAgreementArgs) => {
  if (client === undefined) {
    return { kind: 'needs-database' } as const;
  }

  const judges = judgeAgreement({
    minN: thresholds.minTrialsForRate,
    rows: await readJudgeAgreement({ client }),
    z: thresholds.z,
  });

  return { judges, kind: 'read' } as const;
};
