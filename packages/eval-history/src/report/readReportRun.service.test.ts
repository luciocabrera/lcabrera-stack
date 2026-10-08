import { describe, expect, it } from 'vite-plus/test';

import type { QueryClient, SqlQuery } from '../queries/queries.types.ts';

import { readReportRun } from './readReportRun.service.ts';
import { reportRunQueries } from './reportRunQueries.util.ts';

const RUN_ID = '00000000-0000-4000-8000-000000000001';

const DATABASE_NULLS: Readonly<Record<string, unknown>> = JSON.parse(
  '{"agentPromptHash":null,"catalogHash":null,"expectedHash":null,"judgePromptHash":null}',
);

const runRow = {
  branch: 'main',
  catalogHash: DATABASE_NULLS.catalogHash,
  costUsdReported: 0.36,
  durationsMs: [12_000, 12_000],
  gitSha: 'a'.repeat(40),
  harnessVersion: '1e2df619c23d',
  modelId: 'claude-opus-5-5',
  runId: RUN_ID,
  status: 'complete',
  suite: 'skills',
};

const subjectRow = {
  contentHash: 'c'.repeat(64),
  kind: 'skill',
  name: 'react-19',
};

const taskRow = {
  agentPromptHash: DATABASE_NULLS.agentPromptHash,
  expectedHash: DATABASE_NULLS.expectedHash,
  fixtureHash: 'f'.repeat(64),
  judgePromptHash: DATABASE_NULLS.judgePromptHash,
  outcomes: ['pass', 'fail', 'error'],
  taskHash: 't'.repeat(64),
  taskKey: 'skills/react-19/trigger-1',
};

const clientAnswering = (
  rowsByText: ReadonlyMap<string, readonly unknown[]>,
) => {
  const sent: SqlQuery[] = [];
  const client: QueryClient = {
    query: (query) => {
      sent.push(query);

      return Promise.resolve({ rows: rowsByText.get(query.text) ?? [] });
    },
  };

  return { client, sent };
};

const queries = reportRunQueries(RUN_ID);

describe('readReportRun', () => {
  it('assembles the run, its subjects and its tasks from three queries', async () => {
    const { client, sent } = clientAnswering(
      new Map([
        [queries.run.text, [runRow]],
        [queries.subjects.text, [subjectRow]],
        [queries.tasks.text, [taskRow]],
      ]),
    );

    expect(await readReportRun({ client, runId: RUN_ID })).toStrictEqual({
      ...runRow,
      catalogHash: undefined,
      subjects: [subjectRow],
      tasks: [
        {
          ...taskRow,
          agentPromptHash: undefined,
          expectedHash: undefined,
          judgePromptHash: undefined,
        },
      ],
    });
    expect(sent).toEqual([queries.run, queries.subjects, queries.tasks]);
  });

  it('returns undefined for a run the database does not hold, without reading further', async () => {
    const { client, sent } = clientAnswering(new Map());

    expect(await readReportRun({ client, runId: RUN_ID })).toBeUndefined();
    expect(sent).toEqual([queries.run]);
  });

  it('rejects an outcome the schema does not name', async () => {
    const { client } = clientAnswering(
      new Map([
        [queries.run.text, [runRow]],
        [queries.tasks.text, [{ ...taskRow, outcomes: ['maybe'] }]],
      ]),
    );

    await expect(readReportRun({ client, runId: RUN_ID })).rejects.toThrow();
  });
});
