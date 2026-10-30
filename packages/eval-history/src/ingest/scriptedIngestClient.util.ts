import type { IngestClient, IngestQuery } from './ingest.types.ts';

type ScriptedIngestClientArgs = {
  readonly failOn?: string;
  readonly rowsFor: (text: string) => readonly unknown[];
};

export const scriptedIngestClient = ({
  failOn,
  rowsFor,
}: ScriptedIngestClientArgs) => {
  const queries: IngestQuery[] = [];
  const client: IngestClient = {
    query: (config) => {
      queries.push(config);

      return failOn && config.text.includes(failOn)
        ? Promise.reject(new Error(`failed on ${failOn}`))
        : Promise.resolve({ rows: rowsFor(config.text) });
    },
  };
  const statements = () =>
    queries.map(({ text }) => /evals\.\w+/u.exec(text)?.[0] ?? text.trim());

  return { client, queries, statements };
};
