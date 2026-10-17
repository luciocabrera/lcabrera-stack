import { readdir, readFile, stat } from 'node:fs/promises';

import type {
  IngestConnection,
  IngestFileSystem,
} from '../ingest/ingest.types.ts';

import { connectIngest } from '../ingest/connectIngest.service.ts';
import { evalsDatabaseUrl } from '../ingest/evalsDatabaseUrl.util.ts';
import { ingestPaths } from '../ingest/ingestPaths.service.ts';
import { MIN_BASELINE_RUNS } from '../stats/stats.constants.ts';
import { aggregateBaseline } from './aggregateBaseline.util.ts';
import { BASELINE_DATABASE_URL } from './baseline.constants.ts';
import { baselineEnvelopes } from './baselineEnvelopes.service.ts';
import { baselineHeading } from './baselineHeading.util.ts';
import { baselineLine } from './baselineLine.util.ts';
import { baselineRun } from './baselineRun.util.ts';
import { missingRunsProblem } from './missingRunsProblem.util.ts';
import { writeBaseline } from './writeBaseline.service.ts';

type ChunkCompleteArgs = {
  readonly classified: ShortArgs['classified'];
  readonly earlier: readonly string[];
  readonly files: readonly string[];
  readonly missing: string | undefined;
};

type FailureArgs = {
  readonly stderr: readonly string[];
  readonly stdout?: readonly string[];
};

type RecordBaselineArgs = {
  readonly baselineId: string;
  readonly connect?: (connectionString: string) => Promise<IngestConnection>;
  readonly connectionString: string | undefined;
  readonly earlier?: readonly string[];
  readonly fileSystem?: IngestFileSystem;
  readonly paths: readonly string[];
  readonly runs: number;
};

type ShortArgs = {
  readonly baselineId: string;
  readonly classified: readonly (ReturnType<typeof baselineRun> & {
    readonly file: string;
  })[];
  readonly complete: boolean;
  readonly ingestedStdout: readonly string[];
  readonly unreadable: readonly string[];
};

const NODE_FILE_SYSTEM: IngestFileSystem = { readdir, readFile, stat };

const PREFIX = 'evals:baseline:';

const failure = ({ stderr, stdout = [] }: FailureArgs) => ({
  exitCode: 1,
  stderr,
  stdout,
});

const chunkComplete = ({
  classified,
  earlier,
  files,
  missing,
}: ChunkCompleteArgs) => {
  const usable = new Set(
    classified.filter(({ kind }) => kind === 'run').map(({ file }) => file),
  );

  return (
    missing === undefined &&
    files
      .filter((file) => !earlier.includes(file))
      .every((file) => usable.has(file))
  );
};

const short = ({
  baselineId,
  classified,
  complete,
  ingestedStdout,
  unreadable,
}: ShortArgs) => {
  const usableRuns = classified.filter(({ kind }) => kind === 'run').length;
  const stderr = [
    ...unreadable,
    ...classified
      .filter((entry) => entry.kind === 'excluded')
      .map(({ reason }) => `${PREFIX} ${reason}`),
  ];
  const holds = `${PREFIX} baseline ${baselineId} holds ${String(usableRuns)} usable run(s) and is written once it holds ${String(MIN_BASELINE_RUNS)}`;

  return complete
    ? {
        exitCode: 0,
        stderr,
        stdout: [
          ...ingestedStdout,
          `${holds}; add runs with --baseline-id ${baselineId}`,
        ],
      }
    : failure({
        stderr: [
          ...stderr,
          `${holds}, and a run this invocation commissioned left no usable envelope, so no baseline was written`,
        ],
        stdout: ingestedStdout,
      });
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
  earlier = [],
  fileSystem = NODE_FILE_SYSTEM,
  paths,
  runs,
}: RecordBaselineArgs) => {
  const database = evalsDatabaseUrl({
    ...BASELINE_DATABASE_URL,
    connectionString,
  });

  if (!database.ok) {
    return failure({ stderr: [database.message] });
  }

  const loaded = await baselineEnvelopes({ baselineId, fileSystem, paths });
  const { envelopes } = loaded;
  const missing = missingRunsProblem({
    baselineId,
    found: envelopes.length + loaded.invalid.length,
    paths,
    runs,
  });
  const unreadable = [
    ...loaded.invalid,
    ...loaded.unreadable,
    ...(missing === undefined ? [] : [missing]),
  ].map((problem) => `${PREFIX} ${problem}`);

  if (envelopes.length === 0) {
    return failure({
      stderr: [
        ...unreadable,
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

  const classified = envelopes.map(({ envelope, file }) => ({
    ...baselineRun(envelope),
    file,
  }));
  const usableRuns = classified.filter(({ kind }) => kind === 'run').length;

  if (usableRuns < MIN_BASELINE_RUNS) {
    return short({
      baselineId,
      classified,
      complete: chunkComplete({
        classified,
        earlier,
        files: loaded.files,
        missing,
      }),
      ingestedStdout: ingested.stdout,
      unreadable,
    });
  }

  const { problems, rows } = aggregateBaseline(
    envelopes.map(({ envelope }) => envelope),
  );
  const warnings = [
    ...unreadable,
    ...problems.map((problem) => `${PREFIX} ${problem}`),
  ];

  if (rows.length === 0) {
    return failure({
      stderr: [
        ...warnings,
        `${PREFIX} no subject had a counted result in two runs, so no baseline was written`,
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
