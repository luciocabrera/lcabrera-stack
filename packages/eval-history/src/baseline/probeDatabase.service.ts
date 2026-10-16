import { z } from 'zod';

import type { IngestConnection } from '../ingest/ingest.types.ts';

import { connectIngest } from '../ingest/connectIngest.service.ts';
import { databaseLabel } from '../ingest/databaseLabel.util.ts';
import { errorReason } from '../ingest/errorReason.util.ts';
import { evalsDatabaseUrl } from '../ingest/evalsDatabaseUrl.util.ts';
import {
  BASELINE_DATABASE_URL,
  PROBE_WRITABLE_SQL,
} from './baseline.constants.ts';

type Connect = (connectionString: string) => Promise<IngestConnection>;

type ProbeDatabaseArgs = {
  readonly connect?: Connect;
  readonly connectionString: string | undefined;
};

type ReachArgs = {
  readonly connect: Connect;
  readonly url: string;
};

const probeRowsSchema = z.array(z.object({ writable: z.boolean() }));

const refused = (problem: string) =>
  ({ message: `evals:baseline: ${problem}`, ok: false }) as const;

const reach = async ({ connect, url }: ReachArgs) => {
  try {
    return { connection: await connect(url), ok: true } as const;
  } catch (error) {
    return { ok: false, reason: errorReason(error) } as const;
  }
};

const isWritable = async (connection: IngestConnection) => {
  try {
    const { rows } = await connection.client.query({
      text: PROBE_WRITABLE_SQL,
    });

    return probeRowsSchema.parse(rows)[0]?.writable === true;
  } finally {
    await connection.end();
  }
};

export const probeDatabase = async ({
  connect = connectIngest,
  connectionString,
}: ProbeDatabaseArgs) => {
  const database = evalsDatabaseUrl({
    ...BASELINE_DATABASE_URL,
    connectionString,
  });

  if (!database.ok) {
    return { message: database.message, ok: false } as const;
  }

  const label = databaseLabel(database.url);
  const reached = await reach({ connect, url: database.url });

  if (!reached.ok) {
    return refused(`cannot reach ${label}: ${reached.reason}`);
  }

  try {
    return (await isWritable(reached.connection))
      ? ({ ok: true } as const)
      : refused(
          `${label} has no evals.eval_run and evals.eval_baseline this role can insert into; run \`vp run evals:migrate\` against it, or point EVALS_DATABASE_URL at the evals_writer role`,
        );
  } catch (error) {
    return refused(`cannot check ${label}: ${errorReason(error)}`);
  }
};
