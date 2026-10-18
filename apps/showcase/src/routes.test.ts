/**
 * A fetcher's path and the route that answers it are declared in two files, in
 * two spellings (`/_api/…` against `_api/…`), and nothing else pairs them:
 * rename one and the browser gets this app's 404 document where it expected
 * JSON, with every gate still green. These assertions are that pairing.
 */

import { matchRoutes } from 'react-router';
import { describe, expect, it } from 'vite-plus/test';

import routes from './routes';
import { CAR_SALES_PAGINATED_PATH } from './services/carSales.api';
import { WIDE_ALLTYPES_150_PAGINATED_PATH } from './services/wideAlltypes150.api';

const registeredPaths = new Set(
  routes.map((entry) => ('path' in entry ? entry.path : undefined)),
);

const RUN_ID = '6f1d4c4e-8a4f-4b8c-9a0e-0c1f2d3e4f50';

const answeringFile = (pathname: string) =>
  matchRoutes(
    routes.map(({ file, path }) => ({ id: file, path })),
    pathname,
  )?.at(-1)?.route.id;

describe('routes', () => {
  it('registers a route for the car-sales fetcher path', () => {
    expect(CAR_SALES_PAGINATED_PATH.startsWith('/')).toBe(true);
    expect(registeredPaths).toContain(CAR_SALES_PAGINATED_PATH.slice(1));
  });

  it('registers a route for the wide-alltypes fetcher path', () => {
    expect(WIDE_ALLTYPES_150_PAGINATED_PATH.startsWith('/')).toBe(true);
    expect(registeredPaths).toContain(
      WIDE_ALLTYPES_150_PAGINATED_PATH.slice(1),
    );
  });

  it('registers the routes the table pages themselves are served from', () => {
    expect(registeredPaths).toContain('car-sales');
    expect(registeredPaths).toContain('car-sales-infinite');
    expect(registeredPaths).toContain('skill-scores');
    expect(registeredPaths).toContain('wide-alltypes-150');
  });

  it('registers the eval views the dashboard links between', () => {
    expect(registeredPaths).toContain('evals/compare');
    expect(registeredPaths).toContain('evals/subjects/:kind/:name');
    expect(registeredPaths).toContain('evals/heatmap');
    expect(registeredPaths).toContain('evals/cost');
  });

  it('serves a stored run as JSON beside the run page', () => {
    expect(answeringFile(`/evals/runs/${RUN_ID}.json`)).toBe(
      'routes/evals/run-json/root.ts',
    );
    expect(answeringFile(`/evals/runs/${RUN_ID}`)).toBe(
      'routes/evals/run-detail/root.ts',
    );
    expect(
      matchRoutes(
        [{ path: 'evals/runs/:runId.json' }],
        `/evals/runs/${RUN_ID}.json`,
      )?.[0]?.params,
    ).toEqual({ runId: RUN_ID });
  });
});
