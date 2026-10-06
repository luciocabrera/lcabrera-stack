import type { QueryClient, SqlQuery } from './queries.types.ts';

export const recordingClient = (rows: readonly unknown[]) => {
  const sent: SqlQuery[] = [];
  const client: QueryClient = {
    query: async (query) => {
      sent.push(query);

      return { rows };
    },
  };

  return { client, sent };
};
