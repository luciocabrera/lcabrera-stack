// @vitest-environment node

/**
 * Every /evals route, taken from the route config, answering against the
 * synthetic year of history (at least 15k trials) as the reader role, within
 * the dashboard's 500 ms budget. Each loader is called once to open the
 * reader pool's connections, then timed three times; all three are printed,
 * and the fastest must fit the budget, so one stall on a shared runner does
 * not fail the build. It creates and drops a database and
 * a login role of its own beside the one EVALS_TEST_DATABASE_URL names.
 * Unset, it skips locally and fails under CI.
 */

import type { LoaderFunctionArgs } from 'react-router';

import { seedSyntheticHistory } from '@repo/eval-history/seed/seedSyntheticHistory.service';
import { performance } from 'node:perf_hooks';
import { afterAll, beforeAll, describe, expect, it } from 'vite-plus/test';
import { z } from 'zod';

import { routeLoaderArgs } from '../utils/routeLoaderArgs.util';
import {
  EVALS_ROUTE_ENTRIES as ENTRIES,
  loadEvalsRouteModules,
  routeModuleFor,
} from './evalsRouteModules.fixtures';
import { readerDatabase } from './readerDatabase.fixtures';

const DATABASE_URL = process.env.EVALS_TEST_DATABASE_URL;
const IS_CI = !['', '0', 'false'].includes(process.env.CI ?? '');
const BUDGET_MS = 500;
const SEEDED_TRIALS_AT_LEAST = 15_000;
const SUBJECT = { kind: 'skill', name: 'synthetic-skill-03' };

const pickedSchema = z.tuple([
  z.object({
    a: z.string(),
    b: z.string(),
    trialId: z.string(),
  }),
]);

if (!DATABASE_URL && !IS_CI) {
  process.stderr.write(
    'Skipping the /evals timing tests: EVALS_TEST_DATABASE_URL is unset.\n',
  );
}

it.runIf(IS_CI)('has a database to time the /evals routes against', () => {
  expect(
    DATABASE_URL,
    'EVALS_TEST_DATABASE_URL must be set under CI',
  ).toBeTruthy();
});

describe.skipIf(!DATABASE_URL)('the /evals routes on a year of history', () => {
  const database = readerDatabase({
    prefix: 'evals_timing',
    url: DATABASE_URL ?? '',
  });
  const modules = {
    loaded: new Map() as Awaited<ReturnType<typeof loadEvalsRouteModules>>,
  };
  const picked = { a: '', b: '', trialId: '' };
  const seeded = { runs: 0, trials: 0 };

  const call = (path: string) =>
    routeModuleFor({ loaded: modules.loaded, path }).loader(
      routeLoaderArgs({
        params: { ...SUBJECT, runId: picked.b },
        path,
        search: `?${new URLSearchParams({ a: picked.a, b: picked.b, trial: picked.trialId }).toString()}`,
      }) as LoaderFunctionArgs,
    );

  beforeAll(async () => {
    const { client } = await database.open();

    Object.assign(
      seeded,
      await seedSyntheticHistory({ client, endsOn: '2026-10-01' }),
    );

    const { rows } = await client.query(`select
  (select run_id::text from evals.eval_run order by started_at desc offset 1 limit 1) as a,
  latest.run_id::text as b,
  (select min(id)::text from evals.eval_trial where run_id = latest.run_id) as "trialId"
from (select run_id from evals.eval_run order by started_at desc limit 1) latest`);
    const [first] = pickedSchema.parse(rows);

    Object.assign(picked, first);

    modules.loaded = await loadEvalsRouteModules();
  }, 120_000);

  afterAll(() => database.shut());

  it('holds at least 15k trials', () => {
    expect(seeded.trials).toBeGreaterThanOrEqual(SEEDED_TRIALS_AT_LEAST);
  });

  it.each(ENTRIES.map(({ path }) => ({ path })))(
    '$path answers in under 500 ms',
    async ({ path }) => {
      const answer = await call(path);
      const timed = async () => {
        const started = performance.now();

        await call(path);

        return performance.now() - started;
      };
      const timings = [await timed(), await timed(), await timed()];
      const report = `${path}: ${timings.map((ms) => ms.toFixed(1)).join(', ')} ms`;

      process.stderr.write(`/evals timing ${report}\n`);
      expect(answer).toBeDefined();
      expect(Math.min(...timings), report).toBeLessThan(BUDGET_MS);
    },
    30_000,
  );
});
