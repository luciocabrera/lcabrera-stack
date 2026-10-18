import type { QueryClient } from '../queries/queries.types.ts';
import type { RegressionConfig } from '../stats/stats.types.ts';
import type { ReadEnvelope, ReportConnection } from './report.types.ts';

import { SUITES } from '../envelope/envelope.constants.ts';
import { connectIngest } from '../ingest/connectIngest.service.ts';
import { errorReason } from '../ingest/errorReason.util.ts';
import { inSequence } from '../ingest/inSequence.service.ts';
import { readEnvelopeFile } from '../ingest/readEnvelopeFile.service.ts';
import { compareRuns } from './compareRuns.util.ts';
import { connectionUrl } from './connectionUrl.util.ts';
import { isRunId } from './isRunId.util.ts';
import { latestRunPairs } from './latestRunPairs.service.ts';
import { readReportAgreement } from './readReportAgreement.service.ts';
import { readRuleHistory } from './readRuleHistory.service.ts';
import { ReportInputError } from './reportInput.error.ts';
import { reportMarkdown } from './reportMarkdown.util.ts';
import { resolveRunRef } from './resolveRunRef.service.ts';

type EvalsReportArgs = {
  readonly a?: string;
  readonly allowHarnessChange?: boolean;
  readonly allowModelChange: boolean;
  readonly b?: string;
  readonly branch?: string;
  readonly compare?: string;
  readonly connect?: (connectionString: string) => Promise<ReportConnection>;
  readonly connectionString: string | undefined;
  readonly json: boolean;
  readonly readEnvelope?: ReadEnvelope;
  readonly suite?: string;
  readonly thresholds: RegressionConfig;
};

type RunPairsArgs = Pick<
  EvalsReportArgs,
  'a' | 'b' | 'branch' | 'compare' | 'suite'
> & {
  readonly client: QueryClient | undefined;
  readonly readEnvelope: ReadEnvelope;
};

const USAGE =
  'pass --compare <branch>, optionally with --suite and --branch, or pass both --a and --b, each a run id or an envelope file';

const runPairs = async ({
  a,
  b,
  branch,
  client,
  compare,
  readEnvelope,
  suite,
}: RunPairsArgs) => {
  if (compare !== undefined && client !== undefined) {
    if (branch === undefined) {
      throw new ReportInputError(
        'could not tell which branch the run under test is on; name it with --branch',
      );
    }

    return latestRunPairs({
      base: compare,
      branch,
      client,
      suite: suiteNamed(suite),
    });
  }

  if (a === undefined || b === undefined) {
    throw new ReportInputError(USAGE);
  }

  return [
    {
      a: await resolveRunRef({ client, readEnvelope, ref: a }),
      b: await resolveRunRef({ client, readEnvelope, ref: b }),
    },
  ];
};

const suiteNamed = (suite: string | undefined) => {
  if (suite === undefined) {
    return;
  }

  const known = SUITES.find((name) => name === suite);

  if (known === undefined) {
    throw new ReportInputError(
      `unknown suite ${suite}; name one of ${SUITES.join(', ')}`,
    );
  }

  return known;
};

const isUsable = ({
  a,
  b,
  compare,
  suite,
}: Pick<EvalsReportArgs, 'a' | 'b' | 'compare' | 'suite'>) =>
  compare === undefined
    ? a !== undefined && b !== undefined && suite === undefined
    : a === undefined && b === undefined;

const requiresDatabase = ({
  a,
  b,
  compare,
}: Pick<EvalsReportArgs, 'a' | 'b' | 'compare'>) =>
  compare !== undefined ||
  [a, b].some((ref) => ref !== undefined && isRunId(ref));

const failure = (error: unknown) => ({
  exitCode: 1,
  stderr: [`evals:report: ${errorReason(error)}`],
  stdout: [],
});

export const evalsReport = async ({
  allowHarnessChange = false,
  allowModelChange,
  connect = connectIngest,
  connectionString,
  json,
  readEnvelope = (file) => readEnvelopeFile({ file }),
  thresholds,
  ...selection
}: EvalsReportArgs) => {
  if (!isUsable(selection)) {
    return failure(new ReportInputError(USAGE));
  }

  try {
    const connection = requiresDatabase(selection)
      ? await connect(connectionUrl(connectionString))
      : undefined;

    try {
      const pairs = await runPairs({
        ...selection,
        client: connection?.client,
        readEnvelope,
      });
      const comparisons = await inSequence({
        items: pairs,
        step: async ({ a, b }) =>
          compareRuns({
            a,
            allowHarnessChange,
            allowModelChange,
            b,
            history: await readRuleHistory({
              client: connection?.client,
              config: thresholds,
              run: b,
            }),
            thresholds,
          }),
      });
      const agreement = await readReportAgreement({
        client: connection?.client,
        thresholds,
      });

      return {
        exitCode: comparisons.some(({ kind }) => kind === 'refused') ? 1 : 0,
        stderr: [],
        stdout: [
          json
            ? JSON.stringify({ agreement, comparisons }, undefined, 2)
            : reportMarkdown({ agreement, comparisons, thresholds }),
        ],
      };
    } finally {
      await connection?.end();
    }
  } catch (error) {
    return failure(error);
  }
};
