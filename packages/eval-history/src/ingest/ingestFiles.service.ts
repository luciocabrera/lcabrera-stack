import type {
  IngestConnection,
  IngestResult,
  IngestRows,
} from './ingest.types.ts';

import { compareCodeUnits } from '../hashing/compareCodeUnits.util.ts';
import { errorReason } from './errorReason.util.ts';
import { ingestEnvelope } from './ingestEnvelope.service.ts';
import { inSequence } from './inSequence.service.ts';
import { readEnvelopeFile } from './readEnvelopeFile.service.ts';

type Indexed = {
  readonly file: string;
  readonly runId: string;
  readonly startedAt: string;
  readonly suite: string;
};

type IngestFilesArgs = {
  readonly clock?: () => number;
  readonly connect: () => Promise<IngestConnection>;
  readonly files: readonly string[];
  readonly read?: typeof readEnvelopeFile;
};

type ReportArgs = {
  readonly durationMs?: number;
  readonly file: string;
  readonly problems?: readonly string[];
  readonly result: IngestResult;
  readonly rows?: IngestRows;
  readonly runId?: string;
  readonly suite?: string;
};

const NO_ROWS = { subjects: 0, tasks: 0, trials: 0 };

const CONFLICT_PROBLEM =
  'a run with this run_id is already stored from a different envelope';

const report = ({
  durationMs = 0,
  file,
  problems = [],
  result,
  rows = NO_ROWS,
  runId,
  suite,
}: ReportArgs) => ({ durationMs, file, problems, result, rows, runId, suite });

type IndexArgs = Required<Pick<IngestFilesArgs, 'read'>> & {
  readonly file: string;
};

const indexFile = async ({ file, read }: IndexArgs) => {
  const loaded = await read({ file });

  return loaded.ok
    ? ({
        file,
        ok: true,
        runId: loaded.envelope.run.run_id,
        startedAt: loaded.envelope.run.started_at,
        suite: loaded.envelope.run.suite,
      } as const)
    : ({ file, ok: false, problems: loaded.problems } as const);
};

type SendArgs = Required<Pick<IngestFilesArgs, 'clock' | 'read'>> & {
  readonly connection: IngestConnection;
  readonly indexed: Indexed;
};

const send = async ({ clock, connection, indexed, read }: SendArgs) => {
  const loaded = await read({ file: indexed.file });

  if (!loaded.ok) {
    return report({
      ...indexed,
      problems: loaded.problems,
      result: 'rejected',
    });
  }

  const started = clock();

  try {
    const outcome = await ingestEnvelope({
      client: connection.client,
      envelope: loaded.envelope,
      sha256: loaded.sha256,
    });

    return report({
      ...indexed,
      ...outcome,
      durationMs: clock() - started,
      problems: outcome.result === 'conflict' ? [CONFLICT_PROBLEM] : [],
    });
  } catch (error) {
    return report({
      ...indexed,
      durationMs: clock() - started,
      problems: [errorReason(error)],
      result: 'failed',
    });
  }
};

const openConnection = async (connect: IngestFilesArgs['connect']) => {
  try {
    return { connection: await connect(), ok: true } as const;
  } catch (error) {
    return { ok: false, reason: errorReason(error) } as const;
  }
};

type SendIndexedArgs = Omit<SendArgs, 'connection' | 'indexed'> &
  Pick<IngestFilesArgs, 'connect'> & { readonly indexed: readonly Indexed[] };

const sendIndexed = async ({ connect, indexed, ...args }: SendIndexedArgs) => {
  if (indexed.length === 0) {
    return [];
  }

  const opened = await openConnection(connect);

  if (!opened.ok) {
    return indexed.map((item) =>
      report({
        ...item,
        problems: [`could not connect: ${opened.reason}`],
        result: 'unsent',
      }),
    );
  }

  try {
    return await inSequence({
      items: indexed,
      step: (item) =>
        send({ ...args, connection: opened.connection, indexed: item }),
    });
  } finally {
    await opened.connection.end();
  }
};

export const ingestFiles = async ({
  clock = Date.now,
  connect,
  files,
  read = readEnvelopeFile,
}: IngestFilesArgs) => {
  const index = await inSequence({
    items: files,
    step: (file) => indexFile({ file, read }),
  });
  const rejected = index
    .filter((item) => !item.ok)
    .map(({ file, problems }) =>
      report({ file, problems, result: 'rejected' }),
    );
  const indexed = index
    .filter((item) => item.ok)
    .toSorted((left, right) =>
      compareCodeUnits(left.startedAt, right.startedAt),
    );

  return [
    ...rejected,
    ...(await sendIndexed({ clock, connect, indexed, read })),
  ];
};
