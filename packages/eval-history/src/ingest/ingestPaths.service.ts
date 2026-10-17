import { readdir, readFile, stat } from 'node:fs/promises';

import type { IngestConnection, IngestFileSystem } from './ingest.types.ts';

import { connectIngest } from './connectIngest.service.ts';
import { databaseLabel } from './databaseLabel.util.ts';
import { evalsDatabaseUrl } from './evalsDatabaseUrl.util.ts';
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

export const ingestPaths = async ({
  connect = connectIngest,
  connectionString,
  fileSystem = NODE_FILE_SYSTEM,
  paths,
  quietUnreachable,
}: IngestPathsArgs) => {
  const database = evalsDatabaseUrl({
    command: 'evals:ingest',
    connectionString,
    whenUnset: 'envelopes stay on disk until `vp run evals:ingest` sends them',
  });

  if (!database.ok) {
    return {
      exitCode: quietUnreachable && database.reason === 'unset' ? 0 : 1,
      stderr: [database.message],
      stdout: [],
    };
  }

  const { url } = database;
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
