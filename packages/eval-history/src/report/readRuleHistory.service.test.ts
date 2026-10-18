import { describe, expect, it } from 'vite-plus/test';

import type { QueryClient, SqlQuery } from '../queries/queries.types.ts';

import { SELECT_LATEST_BASELINE_SQL } from '../baseline/baseline.constants.ts';
import { flakyTasksQuery } from '../queries/flakyTasksQuery.util.ts';
import { readRuleHistory } from './readRuleHistory.service.ts';
import { regressionConfigFixture } from './regressionConfigFixture.util.ts';

const config = regressionConfigFixture();

const flakyRow = (suite: string) => ({
  disagreeFraction: 0.3,
  disagreeing: 3,
  runs: 10,
  suite,
  taskKey: `${suite}/task`,
});

const answering = (baselineRows: readonly unknown[]) => {
  const sent: SqlQuery[] = [];
  const client: QueryClient = {
    query: (query) => {
      sent.push(query);

      return Promise.resolve({
        rows:
          query.text === SELECT_LATEST_BASELINE_SQL
            ? baselineRows
            : [flakyRow('skills'), flakyRow('verifier-fixtures')],
      });
    },
  };

  return { client, sent };
};

describe('readRuleHistory', () => {
  it('reads nothing without a client', async () => {
    expect(
      await readRuleHistory({
        client: undefined,
        config,
        run: { modelId: 'model-a', suite: 'skills' },
      }),
    ).toEqual({ kind: 'needs-database' });
  });

  it("reads the suite's flaky tasks over the configured window, and the model's baseline", async () => {
    const { client, sent } = answering([]);

    expect(
      await readRuleHistory({
        client,
        config,
        run: { modelId: 'model-a', suite: 'skills' },
      }),
    ).toEqual({
      baseline: { kind: 'rows', rows: [] },
      flaky: [flakyRow('skills')],
      kind: 'read',
    });
    expect(sent).toEqual([
      flakyTasksQuery(config.flaky),
      { text: SELECT_LATEST_BASELINE_SQL, values: ['skills', 'model-a'] },
    ]);
  });

  it('finds no baseline for a baseline suite whose run names no model', async () => {
    const { client, sent } = answering([]);

    expect(
      await readRuleHistory({
        client,
        config,
        run: { modelId: undefined, suite: 'verifier-fixtures' },
      }),
    ).toMatchObject({ baseline: { kind: 'rows', rows: [] } });
    expect(sent).toHaveLength(1);
  });

  it('asks no baseline of a suite that records none', async () => {
    const { client, sent } = answering([]);

    expect(
      await readRuleHistory({
        client,
        config,
        run: { modelId: undefined, suite: 'rules-consistency' },
      }),
    ).toMatchObject({ baseline: { kind: 'not-required' }, flaky: [] });
    expect(sent).toHaveLength(1);
  });
});
