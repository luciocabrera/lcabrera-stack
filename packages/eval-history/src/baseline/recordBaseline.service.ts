import { readdir, readFile, stat } from 'node:fs/promises';

import type {
  IngestConnection,
  IngestFileSystem,
} from '../ingest/ingest.types.ts';

import { connectIngest } from '../ingest/connectIngest.service.ts';
import { findEnvelopeFiles } from '../ingest/findEnvelopeFiles.service.ts';
import { ingestPaths } from '../ingest/ingestPaths.service.ts';
import { readEnvelopeFile } from '../ingest/readEnvelopeFile.service.ts';
import { aggregateBaseline } from './aggregateBaseline.util.ts';
import { baselineHeading } from './baselineHeading.util.ts';
import { baselineLine } from './baselineLine.util.ts';
import { databaseUrl } from './databaseUrl.util.ts';
import { writeBaseline } from './writeBaseline.service.ts';

type FailureArgs = {
  readonly stderr: readonly string[];
  readonly stdout?: readonly string[];
};

type LoadArgs = Pick<RecordBaselineArgs, 'baselineId' | 'paths'> & {
  readonly fileSystem: IngestFileSystem;
};

type RecordBaselineArgs = {
  readonly baselineId: string;
  readonly connect?: (connectionString: string) => Promise<IngestConnection>;
  readonly connectionString: string | undefined;
  readonly fileSystem?: IngestFileSystem;
  readonly paths: readonly string[];
};

const NODE_FILE_SYSTEM: IngestFileSystem = { readdir, readFile, stat };

const PREFIX = 'evals:baseline:';

const failure = ({ stderr, stdout = [] }: FailureArgs) => ({
  exitCode: 1,
  stderr,
  stdout,
});

const baselineEnvelopes = async ({
  baselineId,
  fileSystem,
  paths,
}: LoadArgs) => {
  const { files } = await findEnvelopeFiles({ fileSystem, paths });
  const loaded = await Promise.all(
    files.map((file) =>
      readEnvelopeFile({ file, readBytes: fileSystem.readFile }),
    ),
  );

  return loaded
    .filter((entry) => entry.ok)
    .filter(({ envelope }) => envelope.run.baseline_id === baselineId);
};

const reportLines = (rows: ReturnType<typeof aggregateBaseline>['rows']) => {
  const headings = [...new Set(rows.map((row) => baselineHeading(row)))];

  return headings.flatMap((heading) => [
    heading,
    ...rows
      .filter((row) => baselineHeading(row) === heading)
      .map((row) => `  ${baselineLine(row)}`),
  ]);
};

export const recordBaseline = async ({
  baselineId,
  connect = connectIngest,
  connectionString,
  fileSystem = NODE_FILE_SYSTEM,
  paths,
}: RecordBaselineArgs) => {
  const database = databaseUrl(connectionString);

  if (!database.ok) {
    return failure({ stderr: [database.message] });
  }

  const envelopes = await baselineEnvelopes({ baselineId, fileSystem, paths });

  if (envelopes.length === 0) {
    return failure({
      stderr: [
        `${PREFIX} no envelope under ${paths.join(', ')} belongs to baseline ${baselineId}`,
      ],
    });
  }

  const ingested = await ingestPaths({
    connect,
    connectionString: database.url,
    fileSystem,
    paths: envelopes.map(({ file }) => file),
    quietUnreachable: false,
  });

  if (ingested.exitCode !== 0) {
    return failure({
      stderr: [
        ...ingested.stderr,
        `${PREFIX} not every run reached the database, so no baseline was written`,
      ],
      stdout: ingested.stdout,
    });
  }

  const { problems, rows } = aggregateBaseline(
    envelopes.map(({ envelope }) => envelope),
  );
  const warnings = problems.map((problem) => `${PREFIX} ${problem}`);

  if (rows.length === 0) {
    return failure({
      stderr: [
        ...warnings,
        `${PREFIX} nothing had two usable runs, so no baseline was written`,
      ],
      stdout: ingested.stdout,
    });
  }

  const connection = await connect(database.url);

  try {
    await writeBaseline({ client: connection.client, rows });
  } finally {
    await connection.end();
  }

  return {
    exitCode: 0,
    stderr: warnings,
    stdout: [...ingested.stdout, ...reportLines(rows)],
  };
};
