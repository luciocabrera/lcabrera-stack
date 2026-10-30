import { z } from 'zod';

import type { AdjudicationEnvelope } from '../envelope/envelope.types.ts';
import type { IngestClient } from './ingest.types.ts';

import {
  INSERT_ADJUDICATION_CASE_SQL,
  INSERT_ADJUDICATION_VERDICTS_SQL,
  SELECT_ADJUDICATION_SHA_SQL,
} from './ingest.constants.ts';
import { inIngestTransaction } from './inIngestTransaction.service.ts';

type IngestAdjudicationArgs = {
  readonly client: IngestClient;
  readonly envelope: AdjudicationEnvelope;
  readonly sha256: string;
};

const shaRowSchema = z.tuple([z.object({ envelope_sha256: z.string() })]);

const NO_ROWS = { cases: 0, verdicts: 0 };

const caseValues = ({ envelope, sha256 }: IngestAdjudicationArgs) => {
  const { case: adjudicated } = envelope;

  return [
    adjudicated.case_id,
    adjudicated.finding_id,
    adjudicated.analyzer,
    adjudicated.rule,
    adjudicated.file,
    adjudicated.content_hash,
    adjudicated.base_sha,
    adjudicated.head_sha,
    adjudicated.pr,
    envelope.outcome,
    adjudicated.created_at,
    envelope.schema_version,
    sha256,
  ];
};

const verdictValues = ({
  case: adjudicated,
  verifiers,
}: AdjudicationEnvelope) => [
  adjudicated.case_id,
  verifiers.map(({ role }) => role),
  verifiers.map(({ model }) => model),
  verifiers.map(({ agent_prompt_hash }) => agent_prompt_hash),
  verifiers.map(({ verdict }) => verdict),
  verifiers.map(({ evidence }) => evidence),
  verifiers.map(({ duration_ms }) => duration_ms),
  verifiers.map(({ tokens_in }) => tokens_in),
  verifiers.map(({ tokens_out }) => tokens_out),
  verifiers.map(({ cost_usd }) => cost_usd),
];

const existingOutcome = async ({
  client,
  envelope,
  sha256,
}: IngestAdjudicationArgs) => {
  const { rows } = await client.query({
    text: SELECT_ADJUDICATION_SHA_SQL,
    values: [envelope.case.case_id],
  });
  const [row] = shaRowSchema.parse(rows);

  return {
    result: row.envelope_sha256 === sha256 ? 'present' : 'conflict',
    rows: NO_ROWS,
  } as const;
};

const writeCase = async (args: IngestAdjudicationArgs) => {
  const { client, envelope } = args;
  const { rows } = await client.query({
    text: INSERT_ADJUDICATION_CASE_SQL,
    values: caseValues(args),
  });

  if (rows.length === 0) {
    return existingOutcome(args);
  }

  await client.query({
    text: INSERT_ADJUDICATION_VERDICTS_SQL,
    values: verdictValues(envelope),
  });

  return {
    result: 'inserted',
    rows: { cases: 1, verdicts: envelope.verifiers.length },
  } as const;
};

export const ingestAdjudication = (args: IngestAdjudicationArgs) =>
  inIngestTransaction({ client: args.client, write: () => writeCase(args) });
