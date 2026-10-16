import pg from 'pg';

import { INGEST_CONNECT_TIMEOUT_MS } from './ingest.constants.ts';

export const connectIngest = async (connectionString: string) => {
  const client = new pg.Client({
    connectionString,
    connectionTimeoutMillis: INGEST_CONNECT_TIMEOUT_MS,
  });

  await client.connect();

  return { client, end: () => client.end() };
};
