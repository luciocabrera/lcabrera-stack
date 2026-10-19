import { z } from 'zod';

import type { QueryClient, SqlQuery } from '../queries/queries.types.ts';

import { TRANSCRIPT_RETENTION_DAYS } from '../ingest/ingest.constants.ts';
import { pruneTranscriptsQuery } from './pruneTranscriptsQuery.util.ts';
import {
  KEPT_TRANSCRIPT_BRANCH,
  SNAPSHOTS_KEPT_PER_SUBJECT,
} from './retain.constants.ts';
import { trimSnapshotsQuery } from './trimSnapshotsQuery.util.ts';

type CountOfArgs = {
  readonly client: QueryClient;
  readonly query: SqlQuery;
};

type RetainEvalsArgs = {
  readonly client: QueryClient;
  readonly now: Date;
};

const countRowSchema = z.tuple([
  z.object({ count: z.number().int().nonnegative() }),
]);

const countOf = async ({ client, query }: CountOfArgs) => {
  const { rows } = await client.query(query);
  const [{ count }] = countRowSchema.parse(rows);

  return count;
};

export const retainEvals = async ({ client, now }: RetainEvalsArgs) => {
  await client.query({ text: 'begin', values: [] });

  try {
    const transcripts = await countOf({
      client,
      query: pruneTranscriptsQuery({
        keptBranch: KEPT_TRANSCRIPT_BRANCH,
        now,
        retentionDays: TRANSCRIPT_RETENTION_DAYS,
      }),
    });
    const snapshots = await countOf({
      client,
      query: trimSnapshotsQuery(SNAPSHOTS_KEPT_PER_SUBJECT),
    });

    await client.query({ text: 'commit', values: [] });

    return { snapshots, transcripts };
  } catch (error) {
    await client.query({ text: 'rollback', values: [] });
    throw error;
  }
};
