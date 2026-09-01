/**
 * A fetcher's path and the route that answers it are declared in two files, in
 * two spellings (`/_api/…` against `_api/…`), and nothing else pairs them:
 * rename one and the browser gets this app's 404 document where it expected
 * JSON, with every gate still green. These assertions are that pairing.
 */

import { describe, expect, it } from 'vite-plus/test';

import routes from './routes';
import { CAR_SALES_PAGINATED_PATH } from './services/carSales.api';
import { WIDE_ALLTYPES_150_PAGINATED_PATH } from './services/wideAlltypes150.api';

const registeredPaths = new Set(
  routes.map((entry) => ('path' in entry ? entry.path : undefined)),
);

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
    expect(registeredPaths).toContain('wide-alltypes-150');
  });
});
