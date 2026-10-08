import type { IngestConnection } from '../ingest/ingest.types.ts';

import { connectIngest } from '../ingest/connectIngest.service.ts';
import { databaseLabel } from '../ingest/databaseLabel.util.ts';
import { errorReason } from '../ingest/errorReason.util.ts';
import { databaseUrl } from './databaseUrl.util.ts';

type ProbeDatabaseArgs = {
  readonly connect?: (connectionString: string) => Promise<IngestConnection>;
  readonly connectionString: string | undefined;
};

export const probeDatabase = async ({
  connect = connectIngest,
  connectionString,
}: ProbeDatabaseArgs) => {
  const database = databaseUrl(connectionString);

  if (!database.ok) {
    return { message: database.message, ok: false } as const;
  }

  try {
    const connection = await connect(database.url);

    await connection.end();

    return { ok: true } as const;
  } catch (error) {
    return {
      message: `evals:baseline: cannot reach ${databaseLabel(database.url)}: ${errorReason(error)}`,
      ok: false,
    } as const;
  }
};
