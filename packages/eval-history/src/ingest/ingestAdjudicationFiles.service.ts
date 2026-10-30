import type { AdjudicationEnvelope } from '../envelope/envelope.types.ts';
import type {
  AdjudicationRows,
  IngestConnection,
  IngestResult,
} from './ingest.types.ts';

import { errorReason } from './errorReason.util.ts';
import { ingestAdjudication } from './ingestAdjudication.service.ts';
import { inSequence } from './inSequence.service.ts';
import { overConnection } from './overConnection.service.ts';
import { readAdjudicationFile } from './readAdjudicationFile.service.ts';

type IngestAdjudicationFilesArgs = {
  readonly clock?: () => number;
  readonly connect: () => Promise<IngestConnection>;
  readonly files: readonly string[];
  readonly read?: typeof readAdjudicationFile;
};

type Loaded = {
  readonly envelope: AdjudicationEnvelope;
  readonly file: string;
  readonly sha256: string;
};

type ReportArgs = {
  readonly caseId?: string;
  readonly durationMs?: number;
  readonly file: string;
  readonly problems?: readonly string[];
  readonly result: IngestResult;
  readonly rows?: AdjudicationRows;
};

const NO_ROWS = { cases: 0, verdicts: 0 };

const CONFLICT_PROBLEM =
  'a case with this case_id is already stored from a different envelope';

const report = ({
  caseId,
  durationMs = 0,
  file,
  problems = [],
  result,
  rows = NO_ROWS,
}: ReportArgs) => ({ caseId, durationMs, file, problems, result, rows });

type SendArgs = {
  readonly clock: () => number;
  readonly connection: IngestConnection;
  readonly loaded: Loaded;
};

const send = async ({ clock, connection, loaded }: SendArgs) => {
  const { envelope, file, sha256 } = loaded;
  const caseId = envelope.case.case_id;
  const started = clock();

  try {
    const outcome = await ingestAdjudication({
      client: connection.client,
      envelope,
      sha256,
    });

    return report({
      ...outcome,
      caseId,
      durationMs: clock() - started,
      file,
      problems: outcome.result === 'conflict' ? [CONFLICT_PROBLEM] : [],
    });
  } catch (error) {
    return report({
      caseId,
      durationMs: clock() - started,
      file,
      problems: [errorReason(error)],
      result: 'failed',
    });
  }
};

export const ingestAdjudicationFiles = async ({
  clock = Date.now,
  connect,
  files,
  read = readAdjudicationFile,
}: IngestAdjudicationFilesArgs) => {
  const results = await inSequence({
    items: files,
    step: (file) => read({ file }),
  });
  const rejected = results
    .filter((item) => !item.ok)
    .map(({ file, problems }) =>
      report({ file, problems, result: 'rejected' }),
    );
  const loaded = results.filter((item) => item.ok);

  return [
    ...rejected,
    ...(await overConnection({
      connect,
      items: loaded,
      step: ({ connection, item }) => send({ clock, connection, loaded: item }),
      unsent: ({ item, problem }) =>
        report({
          caseId: item.envelope.case.case_id,
          file: item.file,
          problems: [problem],
          result: 'unsent',
        }),
    })),
  ];
};
