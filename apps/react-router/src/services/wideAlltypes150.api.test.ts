import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vite-plus/test';

import {
  fetchWideAlltypes150Page,
  WIDE_ALLTYPES_150_PAGINATED_PATH,
} from './wideAlltypes150.api';

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

describe('fetchWideAlltypes150Page', () => {
  it("reads this app's own resource route when no external API is configured", async () => {
    vi.stubEnv('VITE_API_URL', undefined);

    await fetchWideAlltypes150Page({ limit: 50, skip: 100 });

    expect(requestedUrl()).toBe(
      `${WIDE_ALLTYPES_150_PAGINATED_PATH}?limit=50&skip=100`,
    );
  });

  it('reads the external API host when VITE_API_URL is set', async () => {
    vi.stubEnv('VITE_API_URL', 'http://api.test/api');

    await fetchWideAlltypes150Page({ limit: 50, skip: 100 });

    expect(requestedUrl()).toBe(
      'http://api.test/api/wide-alltypes-150/paginated?limit=50&skip=100',
    );
  });

  it('honours the override host under SSR, where a requestUrl is present', async () => {
    // Same regression as the car-sales fetcher: until #705 an SSR `requestUrl`
    // outranked `VITE_API_URL` inside `getApiBaseUrl`, so the loader fetched
    // the request's own origin instead of the override (#701 review).
    vi.stubEnv('VITE_API_URL', 'http://override.example:9999/api');

    await fetchWideAlltypes150Page({
      limit: 50,
      requestUrl: 'http://localhost:5173/wide-alltypes-150',
      skip: 0,
    });

    expect(requestedUrl()).toBe(
      'http://override.example:9999/api/wide-alltypes-150/paginated?limit=50&skip=0',
    );
  });

  it('rejects a response that is not a wide-alltypes page', async () => {
    vi.stubEnv('VITE_API_URL', undefined);
    fetchMock.mockResolvedValueOnce(Response.json({ data: [], total: 0 }));

    await expect(
      fetchWideAlltypes150Page({ limit: 1, skip: 0 }),
    ).rejects.toThrow(/Unexpected response shape/);
  });
});
