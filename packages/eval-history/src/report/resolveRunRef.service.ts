import type { QueryClient } from '../queries/queries.types.ts';
import type { ReadEnvelope } from './report.types.ts';

import { isRunId } from './isRunId.util.ts';
import { readReportRun } from './readReportRun.service.ts';
import { ReportInputError } from './reportInput.error.ts';
import { reportRunFromEnvelope } from './reportRunFromEnvelope.util.ts';

type ResolveRunRefArgs = {
  readonly client: QueryClient | undefined;
  readonly readEnvelope: ReadEnvelope;
  readonly ref: string;
};

const runFromDatabase = async ({
  client,
  ref,
}: Omit<ResolveRunRefArgs, 'readEnvelope'>) => {
  const run =
    client === undefined
      ? undefined
      : await readReportRun({ client, runId: ref });

  if (run === undefined) {
    throw new ReportInputError(`run ${ref} is not in the database`);
  }

  return run;
};

export const resolveRunRef = async ({
  client,
  readEnvelope,
  ref,
}: ResolveRunRefArgs) => {
  if (isRunId(ref)) {
    return runFromDatabase({ client, ref });
  }

  const read = await readEnvelope(ref);

  if (!read.ok) {
    throw new ReportInputError(
      `${ref} is neither a run id nor a readable envelope: ${read.problems.join('; ')}`,
    );
  }

  return reportRunFromEnvelope(read.envelope);
};
