import type { QueryClient } from '../queries/queries.types.ts';
import type { ReportRun, Suite } from './report.types.ts';

import { SUITES } from '../envelope/envelope.constants.ts';
import { readLatestRunId } from './readLatestRunId.service.ts';
import { readReportRun } from './readReportRun.service.ts';
import { ReportInputError } from './reportInput.error.ts';

type LatestRunArgs = {
  readonly branch: string;
  readonly client: QueryClient;
  readonly suite: Suite;
};

type LatestRunPairsArgs = {
  readonly base: string;
  readonly branch: string;
  readonly client: QueryClient;
  readonly suite?: Suite;
};

type RunPair = {
  readonly a: ReportRun;
  readonly b: ReportRun;
};

const latestRun = async (args: LatestRunArgs) => {
  const runId = await readLatestRunId(args);

  return runId === undefined
    ? undefined
    : readReportRun({ client: args.client, runId });
};

export const latestRunPairs = async ({
  base,
  branch,
  client,
  suite,
}: LatestRunPairsArgs) => {
  if (base === branch) {
    throw new ReportInputError(
      `the run under test is on ${branch} as well; name its branch with --branch, or pass two runs to --a and --b`,
    );
  }

  const pairs: RunPair[] = [];
  const suites = suite === undefined ? SUITES : [suite];

  for (const name of suites) {
    const a = await latestRun({ branch: base, client, suite: name });
    const b = await latestRun({ branch, client, suite: name });

    if (a !== undefined && b !== undefined) {
      pairs.push({ a, b });
    }
  }

  if (pairs.length === 0) {
    throw new ReportInputError(
      `no ${suite ?? 'suite'} run is complete on both ${base} and ${branch}`,
    );
  }

  return pairs;
};
