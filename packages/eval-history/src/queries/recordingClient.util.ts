import type { QueryClient, SqlQuery } from './queries.types.ts';

export const recordingClient = (rows: readonly unknown[]) => {
  const sent: SqlQuery[] = [];
  const client: QueryClient = {
    query: (query) => {
      sent.push(query);

      return Promise.resolve({ rows });
    },
  };

  return { client, sent };
};
