import type { IngestClient, IngestResult } from './ingest.types.ts';

type InIngestTransactionArgs<Outcome> = {
  readonly client: IngestClient;
  readonly write: () => Promise<Outcome>;
};

export const inIngestTransaction = async <
  Outcome extends { readonly result: IngestResult },
>({
  client,
  write,
}: InIngestTransactionArgs<Outcome>) => {
  await client.query({ text: 'begin' });

  try {
    const outcome = await write();

    await client.query({
      text: outcome.result === 'inserted' ? 'commit' : 'rollback',
    });

    return outcome;
  } catch (error) {
    await client.query({ text: 'rollback' });
    throw error;
  }
};
