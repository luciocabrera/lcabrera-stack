import { readdir, readFile, stat } from 'node:fs/promises';

import type { IngestConnection, IngestFileSystem } from './ingest.types.ts';

import { evalsDatabaseEnvSchema } from '../migrate/evalsDatabaseEnv.schema.ts';
import { connectIngest } from './connectIngest.service.ts';
import { databaseLabel } from './databaseLabel.util.ts';
import { findEnvelopeFiles } from './findEnvelopeFiles.service.ts';
import { ingestFiles } from './ingestFiles.service.ts';
import { ingestSummary } from './ingestSummary.util.ts';
import { readEnvelopeFile } from './readEnvelopeFile.service.ts';

type IngestPathsArgs = {
  readonly connect?: (connectionString: string) => Promise<IngestConnection>;
  readonly connectionString: string | undefined;
  readonly fileSystem?: IngestFileSystem;
  readonly paths: readonly string[];
  readonly quietUnreachable: boolean;
};

const NODE_FILE_SYSTEM: IngestFileSystem = { readdir, readFile, stat };

const UNSET_WARNING =
  'evals:ingest: EVALS_DATABASE_URL is unset, so envelopes stay on disk until `vp run evals:ingest` sends them (ADR-130)';

const INVALID_ERROR =
  'evals:ingest: EVALS_DATABASE_URL must be a postgres:// URL (ADR-130)';

export const ingestPaths = async ({
  connect = connectIngest,
  connectionString,
  fileSystem = NODE_FILE_SYSTEM,
  paths,
  quietUnreachable,
}: IngestPathsArgs) => {
  if (!connectionString) {
    return {
      exitCode: quietUnreachable ? 0 : 1,
      stderr: [UNSET_WARNING],
      stdout: [],
    };
  }

  const env = evalsDatabaseEnvSchema.safeParse({
    EVALS_DATABASE_URL: connectionString,
  });

  if (!env.success) {
    return { exitCode: 1, stderr: [INVALID_ERROR], stdout: [] };
  }

  const url = env.data.EVALS_DATABASE_URL;
  const { files, missing } = await findEnvelopeFiles({ fileSystem, paths });
  const reports = await ingestFiles({
    connect: () => connect(url),
    files,
    read: (args) =>
      readEnvelopeFile({ ...args, readBytes: fileSystem.readFile }),
  });

  return ingestSummary({
    database: databaseLabel(url),
    missing,
    quietUnreachable,
    reports,
  });
};
