import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vite-plus/test';

import { CAR_SALES_PAGINATED_PATH, fetchCarSalesPage } from './carSales.api';

const PAGE = { data: [], hasMore: false, total: 0 };

/**
 * Typed to the one call shape `createPaginatedFetcher` makes — a string URL —
 * so `mock.calls` carries it and the requested URL, which is the whole
 * assertion in this file, needs no narrowing.
 */
const fetchMock = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>(
  () => Promise.resolve(Response.json(PAGE)),
);

const requestedUrl = () => fetchMock.mock.calls.at(0)?.at(0) ?? '';

beforeEach(() => {
  fetchMock.mockClear();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('fetchCarSalesPage', () => {
  it('reads this app`s own resource route when no external API is configured', async () => {
    vi.stubEnv('VITE_API_URL', undefined);

    await fetchCarSalesPage({ limit: 25, skip: 50 });

    // Same-origin and path-only: no origin is resolved at all, which is what
    // lets the same call work in the browser and in an SSR loader.
    expect(requestedUrl()).toBe(`${CAR_SALES_PAGINATED_PATH}?limit=25&skip=50`);
  });

  it('reads the external API host when VITE_API_URL is set', async () => {
    vi.stubEnv('VITE_API_URL', 'http://api.test/api');

    await fetchCarSalesPage({ limit: 25, skip: 50 });

    expect(requestedUrl()).toBe(
      'http://api.test/api/car-sales/paginated?limit=25&skip=50',
    );
  });

  it('sends the sort payload on either path', async () => {
    vi.stubEnv('VITE_API_URL', undefined);

    await fetchCarSalesPage({
      limit: 10,
      skip: 0,
      sorting: [{ columnKey: 'model', direction: 'desc' }],
    });

    expect(requestedUrl()).toContain(
      `sort=${encodeURIComponent('[{"columnKey":"model","direction":"desc"}]')}`,
    );
  });

  it('rejects a response that is not a car-sales page', async () => {
    vi.stubEnv('VITE_API_URL', undefined);
    fetchMock.mockResolvedValueOnce(Response.json({ rows: [] }));

    await expect(fetchCarSalesPage({ limit: 1, skip: 0 })).rejects.toThrow(
      /Unexpected response shape/,
    );
  });
});
