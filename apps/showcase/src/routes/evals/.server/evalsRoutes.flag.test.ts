// @vitest-environment node

/**
 * Every /evals route, taken from the app's route config so a new one is
 * covered without touching this file, answers 404 while EVALS_DASHBOARD is
 * unset. The reader URL points at a port nothing listens on, so a loader that
 * read the database before checking the flag fails here with a connection
 * error instead of a 404.
 */

import type { LoaderFunctionArgs } from 'react-router';

import { closeEvalsReaderPool } from '@repo/eval-history/queries/evalsReaderPool.service';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vite-plus/test';

import { routeLoaderArgs } from '../utils/routeLoaderArgs.util';
import {
  EVALS_ROUTE_ENTRIES as ENTRIES,
  loadEvalsRouteModules,
} from './evalsRouteModules.fixtures';

const modules = {
  loaded: new Map() as Awaited<ReturnType<typeof loadEvalsRouteModules>>,
};

beforeAll(async () => {
  modules.loaded = await loadEvalsRouteModules();
}, 60_000);

const RUN_ID = '00000000-0000-4000-8000-000000000000';

const PARAMS = { kind: 'skill', name: 'react-19', runId: RUN_ID };

beforeEach(() => {
  vi.stubEnv('EVALS_DASHBOARD', '');
  vi.stubEnv('EVALS_READER_DATABASE_URL', 'postgres://nobody@127.0.0.1:1/none');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

afterAll(async () => {
  await closeEvalsReaderPool();
});

describe('the /evals routes with the flag unset', () => {
  it('finds routes to check', () => {
    expect(ENTRIES.length).toBeGreaterThan(0);
  });

  it.each(ENTRIES)('$path answers 404', async ({ file, path }) => {
    const routeModule = modules.loaded.get(file);

    expect(
      routeModule,
      `${file} is not a module this test can load`,
    ).toBeDefined();

    const loader = routeModule?.loader ?? (() => Promise.resolve('no loader'));
    const outcome = await (async () => {
      try {
        await loader(
          routeLoaderArgs({
            params: PARAMS,
            path,
            search: `?trial=1&a=${RUN_ID}&b=${RUN_ID}`,
          }) as LoaderFunctionArgs,
        );

        return 'answered';
      } catch (error) {
        return error instanceof Response ? error.status : error;
      }
    })();

    expect(outcome).toBe(404);
  });
});
