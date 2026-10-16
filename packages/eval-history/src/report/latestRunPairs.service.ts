import type { QueryClient } from '../queries/queries.types.ts';
import type { Suite } from './report.types.ts';

import { SUITES } from '../envelope/envelope.constants.ts';
import { inSequence } from '../ingest/inSequence.service.ts';
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

  const suites = suite === undefined ? SUITES : [suite];
  const candidates = await inSequence({
    items: suites,
    step: async (name) => {
      const a = await latestRun({ branch: base, client, suite: name });
      const b = await latestRun({ branch, client, suite: name });

      return a === undefined || b === undefined ? undefined : { a, b };
    },
  });
  const pairs = candidates.filter((pair) => pair !== undefined);

  if (pairs.length === 0) {
    throw new ReportInputError(
      `no ${suite ?? 'suite'} run is complete on both ${base} and ${branch}`,
    );
  }

  return pairs;
};
