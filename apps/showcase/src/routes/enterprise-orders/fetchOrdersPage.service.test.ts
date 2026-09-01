import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { fetchOrdersPage } from './fetchOrdersPage.service';

const stubFetch = (body: unknown) => {
  const fetchMock = vi.fn<typeof fetch>(
    async () =>
      ({
        json: async () => body,
        ok: true,
        status: 200,
        statusText: 'OK',
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

  return input;
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('fetchOrdersPage', () => {
  it('reads the app resource route same-origin', async () => {
    const fetchMock = stubFetch({ data: [], hasMore: false, total: 0 });

    await fetchOrdersPage({ limit: 50, skip: 0 });

    expect(requestedUrl(fetchMock)).toMatch(
      /^\/_api\/enterprise-orders\/paginated\?/,
    );
  });

  it('forwards the keyset cursor and filter this endpoint supports', async () => {
    const fetchMock = stubFetch({ data: [], hasMore: false });

    await fetchOrdersPage({
      cursor: [42],
      filter: { order_status: { operator: 'equals', value: 'shipped' } },
      limit: 50,
      skip: 50,
    });

    const { searchParams } = new URL(
      requestedUrl(fetchMock),
      'https://app.test',
    );
    expect(searchParams.get('cursor')).toBe('[42]');
    expect(searchParams.get('filter')).toContain('order_status');
  });

  it('rejects a payload that is not an orders page', async () => {
    stubFetch({ rows: [] });

    await expect(fetchOrdersPage({ limit: 50, skip: 0 })).rejects.toThrow(
      'Unexpected response shape',
    );
  });
});
