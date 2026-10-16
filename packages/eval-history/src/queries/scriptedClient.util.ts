import type { QueryClient, SchemaColumn, SqlQuery } from './queries.types.ts';

import { EVALS_BASE_COLUMNS_SQL } from './queries.constants.ts';

type ScriptedClientArgs = {
  readonly answer: (query: SqlQuery) => readonly unknown[];
  readonly columns: readonly SchemaColumn[];
};

export const scriptedClient = ({ answer, columns }: ScriptedClientArgs) => {
  const sent: SqlQuery[] = [];
  const client: QueryClient = {
    query: (query) => {
      sent.push(query);

      return Promise.resolve({
        rows: query.text === EVALS_BASE_COLUMNS_SQL ? columns : answer(query),
      });
    },
  };

  return { client, sent };
};
