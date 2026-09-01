import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { createPaginatedFetcher } from './create-paginated-fetcher.util.ts';

type Page = { readonly data: readonly string[]; readonly hasMore: boolean };

const isPage = (value: unknown): value is Page =>
  typeof value === 'object' &&
  value !== null &&
  Array.isArray((value as Page).data);

const page: Page = { data: ['a'], hasMore: false };

type StubFetchArgs = {
  readonly body: unknown;
  readonly isOk?: boolean;
};

const stubFetch = ({ body, isOk = true }: StubFetchArgs) => {
  const fetchMock = vi.fn<typeof fetch>(
    async () =>
      ({
        json: async () => body,
        ok: isOk,
        status: isOk ? 200 : 500,
        statusText: isOk ? 'OK' : 'Server Error',
      }) as Response,
  );

  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
};

const requestedUrl = (fetchMock: ReturnType<typeof stubFetch>) => {
  const input = fetchMock.mock.calls[0]?.[0];

  if (typeof input !== 'string') {
    throw new TypeError('fetch was not called with a string URL');
  }

  return new URL(input, 'https://base.test');
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('createPaginatedFetcher', () => {
  it('requests the path same-origin when no resolver is given', async () => {
    const fetchMock = stubFetch({ body: page });
    const fetchPage = createPaginatedFetcher({
      isValid: isPage,
      path: '/_api/orders/paginated',
    });

    await fetchPage({ limit: 50, skip: 0 });

    const url = requestedUrl(fetchMock);
    expect(url.pathname).toBe('/_api/orders/paginated');
    expect(url.searchParams.get('limit')).toBe('50');
    expect(url.searchParams.get('skip')).toBe('0');
  });

  it('prefixes the path with the resolved origin', async () => {
    const fetchMock = stubFetch({ body: page });
    const fetchPage = createPaginatedFetcher({
      isValid: isPage,
      path: '/car-sales/paginated',
      resolveBaseUrl: () => 'https://api.test/v1',
    });

    await fetchPage({ limit: 10, skip: 0 });

    expect(requestedUrl(fetchMock).href).toContain(
      'https://api.test/v1/car-sales/paginated?',
    );
  });

  it('hands the SSR request URL to the resolver', async () => {
    stubFetch({ body: page });
    const resolveBaseUrl = vi.fn(() => 'https://ssr.test');
    const fetchPage = createPaginatedFetcher({
      isValid: isPage,
      path: '/rows',
      resolveBaseUrl,
    });

    await fetchPage({
      limit: 10,
      requestUrl: 'https://app.test/cars',
      skip: 0,
    });

    expect(resolveBaseUrl).toHaveBeenCalledWith('https://app.test/cars');
  });

  it('omits cursor and filter when the caller passes none', async () => {
    const fetchMock = stubFetch({ body: page });
    const fetchPage = createPaginatedFetcher({
      isValid: isPage,
      path: '/rows',
    });

    await fetchPage({ limit: 10, skip: 0 });

    const { searchParams } = requestedUrl(fetchMock);
    expect(searchParams.has('cursor')).toBe(false);
    expect(searchParams.has('filter')).toBe(false);
  });

  it('forwards cursor, filter and sorting when supplied', async () => {
    const fetchMock = stubFetch({ body: page });
    const fetchPage = createPaginatedFetcher({
      isValid: isPage,
      path: '/rows',
    });

    await fetchPage({
      cursor: [7, 'b'],
      filter: { status: { operator: 'eq', value: 'open' } },
      limit: 10,
      skip: 20,
      sorting: [{ columnKey: 'id', direction: 'asc' }],
    });

    const { searchParams } = requestedUrl(fetchMock);
    expect(searchParams.get('cursor')).toBe('[7,"b"]');
    expect(searchParams.get('sort')).toBe(
      '[{"columnKey":"id","direction":"asc"}]',
    );
    expect(searchParams.get('filter')).toContain('"status"');
  });

  it('returns the validated body', async () => {
    stubFetch({ body: page });
    const fetchPage = createPaginatedFetcher({
      isValid: isPage,
      path: '/rows',
    });

    await expect(fetchPage({ limit: 10, skip: 0 })).resolves.toEqual(page);
  });

  it('throws the default shape message when the guard rejects the body', async () => {
    stubFetch({ body: { nope: true } });
    const fetchPage = createPaginatedFetcher({
      isValid: isPage,
      path: '/rows',
    });

    await expect(fetchPage({ limit: 10, skip: 0 })).rejects.toThrow(
      'Unexpected response shape from /rows',
    );
  });

  it('throws a caller-supplied shape message instead', async () => {
    stubFetch({ body: { nope: true } });
    const fetchPage = createPaginatedFetcher({
      isValid: isPage,
      path: '/rows',
      shapeErrorMessage: 'Bad rows page',
    });

    await expect(fetchPage({ limit: 10, skip: 0 })).rejects.toThrow(
      'Bad rows page',
    );
  });

  it('propagates a non-OK response as an error', async () => {
    stubFetch({ body: page, isOk: false });
    const fetchPage = createPaginatedFetcher({
      isValid: isPage,
      path: '/rows',
    });

    await expect(fetchPage({ limit: 10, skip: 0 })).rejects.toThrow(
      'API request failed: 500 Server Error',
    );
  });

  it('forwards signal and timeoutMs to the underlying fetch', async () => {
    const fetchMock = stubFetch({ body: page });
    const fetchPage = createPaginatedFetcher({
      isValid: isPage,
      path: '/rows',
    });
    const controller = new AbortController();

    await fetchPage({
      limit: 10,
      signal: controller.signal,
      skip: 0,
      timeoutMs: 1000,
    });

    expect(fetchMock.mock.calls[0]?.[1]?.signal).toBeInstanceOf(AbortSignal);
  });
});
