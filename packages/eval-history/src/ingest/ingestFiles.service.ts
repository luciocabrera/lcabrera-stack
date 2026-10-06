import type { RunEnvelope } from '../envelope/envelope.types.ts';
import type {
  IngestConnection,
  IngestReport,
  IngestResult,
  IngestRows,
} from './ingest.types.ts';

import { compareCodeUnits } from '../hashing/compareCodeUnits.util.ts';
import { errorReason } from './errorReason.util.ts';
import { ingestEnvelope } from './ingestEnvelope.service.ts';
import { readEnvelopeFile } from './readEnvelopeFile.service.ts';

type IngestFilesArgs = {
  readonly clock?: () => number;
  readonly connect: () => Promise<IngestConnection>;
  readonly files: readonly string[];
  readonly read?: typeof readEnvelopeFile;
};

type Loaded = {
  readonly envelope: RunEnvelope;
  readonly file: string;
  readonly sha256: string;
};

type ReportArgs = {
  readonly durationMs?: number;
  readonly envelope?: RunEnvelope;
  readonly file: string;
  readonly problems?: readonly string[];
  readonly result: IngestResult;
  readonly rows?: IngestRows;
};

const NO_ROWS = { subjects: 0, tasks: 0, trials: 0 };

const CONFLICT_PROBLEM =
  'a run with this run_id is already stored from a different envelope';

const report = ({
  durationMs = 0,
  envelope,
  file,
  problems = [],
  result,
  rows = NO_ROWS,
}: ReportArgs) => ({
  durationMs,
  file,
  problems,
  result,
  rows,
  runId: envelope?.run.run_id,
  suite: envelope?.run.suite,
});

type SendArgs = {
  readonly clock: () => number;
  readonly connection: IngestConnection;
  readonly loaded: Loaded;
};

const send = async ({ clock, connection, loaded }: SendArgs) => {
  const started = clock();

  try {
    const outcome = await ingestEnvelope({
      client: connection.client,
      envelope: loaded.envelope,
      sha256: loaded.sha256,
    });

    return report({
      ...loaded,
      ...outcome,
      durationMs: clock() - started,
      problems: outcome.result === 'conflict' ? [CONFLICT_PROBLEM] : [],
    });
  } catch (error) {
    return report({
      ...loaded,
      durationMs: clock() - started,
      problems: [errorReason(error)],
      result: 'failed',
    });
  }
};

type SendAllArgs = Omit<SendArgs, 'loaded'> & {
  readonly loaded: readonly Loaded[];
};

const sendAll = async ({ loaded, ...args }: SendAllArgs) =>
  loaded.reduce<Promise<readonly IngestReport[]>>(
    async (previous, item) => [
      ...(await previous),
      await send({ ...args, loaded: item }),
    ],
    Promise.resolve([]),
  );

const openConnection = async (connect: IngestFilesArgs['connect']) => {
  try {
    return { connection: await connect(), ok: true } as const;
  } catch (error) {
    return { ok: false, reason: errorReason(error) } as const;
  }
};

type SendLoadedArgs = Pick<IngestFilesArgs, 'connect'> &
  Pick<SendArgs, 'clock'> & { readonly loaded: readonly Loaded[] };

const sendLoaded = async ({ clock, connect, loaded }: SendLoadedArgs) => {
  if (loaded.length === 0) {
    return [];
  }

  const opened = await openConnection(connect);

  if (!opened.ok) {
    return loaded.map((item) =>
      report({
        ...item,
        problems: [`could not connect: ${opened.reason}`],
        result: 'unsent',
      }),
    );
  }

  try {
    return await sendAll({ clock, connection: opened.connection, loaded });
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
  const results = await Promise.all(files.map((file) => read({ file })));
  const rejected = results
    .filter((item) => !item.ok)
    .map(({ file, problems }) =>
      report({ file, problems, result: 'rejected' }),
    );
  const loaded = results
    .filter((item) => item.ok)
    .toSorted((left, right) =>
      compareCodeUnits(
        left.envelope.run.started_at,
        right.envelope.run.started_at,
      ),
    );

  return [...rejected, ...(await sendLoaded({ clock, connect, loaded }))];
};
