import { describe, expect, it } from 'vite-plus/test';

import type { QueryClient } from '../queries/queries.types.ts';

import { latestRunPairs } from './latestRunPairs.service.ts';
import { reportRunQueries } from './reportRunQueries.util.ts';

const MAIN_RUN = '00000000-0000-4000-8000-00000000000a';
const FEATURE_RUN = '00000000-0000-4000-8000-00000000000b';

type RunRowArgs = {
  readonly branch: string;
  readonly runId: string;
};

const DATABASE_NULLS: Readonly<Record<string, unknown>> = JSON.parse(
  '{"catalogHash":null,"costUsdReported":null}',
);

const runRow = ({ branch, runId }: RunRowArgs) => ({
  ...DATABASE_NULLS,
  branch,
  durationsMs: [],
  gitSha: 'a'.repeat(40),
  harnessVersion: '1e2df619c23d',
  modelId: 'claude-opus-5-5',
  runId,
  status: 'complete',
  suite: 'skills',
});

const fakeDatabase: QueryClient = {
  query: ({ text, values }) => {
    const [first, second] = values;

    if (text.includes('limit 1')) {
      const runId = { feat: FEATURE_RUN, main: MAIN_RUN }[String(first)];

      return Promise.resolve({
        rows: second === 'skills' && runId !== undefined ? [{ runId }] : [],
      });
    }

    if (text === reportRunQueries(String(first)).run.text) {
      return Promise.resolve({
        rows: [
          runRow({
            branch: first === MAIN_RUN ? 'main' : 'feat',
            runId: String(first),
          }),
        ],
      });
    }

    return Promise.resolve({ rows: [] });
  },
};

describe('latestRunPairs', () => {
  it('pairs the newest run of each suite both branches have', async () => {
    const pairs = await latestRunPairs({
      base: 'main',
      branch: 'feat',
      client: fakeDatabase,
    });

    expect(pairs.map(({ a, b }) => [a.runId, b.runId, b.suite])).toEqual([
      [MAIN_RUN, FEATURE_RUN, 'skills'],
    ]);
  });

  it('says which branches had no run in common', async () => {
    await expect(
      latestRunPairs({
        base: 'main',
        branch: 'feat',
        client: fakeDatabase,
        suite: 'skill-quality',
      }),
    ).rejects.toThrow('no skill-quality run is complete on both main and feat');
  });

  it('refuses to compare a branch with itself', async () => {
    await expect(
      latestRunPairs({ base: 'main', branch: 'main', client: fakeDatabase }),
    ).rejects.toThrow(/--branch/u);
  });
});
