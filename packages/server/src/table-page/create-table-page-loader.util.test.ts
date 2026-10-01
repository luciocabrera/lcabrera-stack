import { beforeEach, expect, it, vi } from 'vite-plus/test';

import { createTablePageLoader } from './create-table-page-loader.util.ts';

const resolvePageRead =
  vi.fn<Parameters<typeof createTablePageLoader>[0]['resolvePageRead']>();
const selectPage = vi.fn<
  Parameters<typeof createTablePageLoader>[0]['selectPage']
>(async () => ({ data: [{ id: 1 }], hasMore: true, total: 5 }));

const loader = createTablePageLoader({ resolvePageRead, selectPage });

const READ = {
  filters: [],
  includeTotal: true,
  limit: 25,
  offset: 50,
  sort: [{ column: 'id', direction: 'asc' }],
} as const;

beforeEach(() => {
  resolvePageRead.mockReset();
  selectPage.mockClear();
});

it('resolves the read from the request URL and returns the page as JSON', async () => {
  resolvePageRead.mockResolvedValueOnce({ kind: 'read', read: READ });

  const response = await loader({
    request: new Request('http://localhost/items?limit=25&skip=50'),
  });

  expect(response).toBeInstanceOf(Response);
  expect(await response.json()).toStrictEqual({
    data: [{ id: 1 }],
    hasMore: true,
    total: 5,
  });
  expect(resolvePageRead.mock.calls[0]?.[0].get('skip')).toBe('50');
  expect(selectPage).toHaveBeenCalledWith(READ);
});

it('answers a refused read with an empty page carrying the refusal, and reads nothing', async () => {
  resolvePageRead.mockResolvedValueOnce({
    kind: 'refused',
    message: 'No group named.',
    reason: 'malformed',
  });

  const response = await loader({
    request: new Request('http://localhost/items?group=bad'),
  });

  expect(await response.json()).toStrictEqual({
    data: [],
    error: { kind: 'unexpected', message: 'No group named.' },
    hasMore: false,
    total: 0,
  });
  expect(selectPage).not.toHaveBeenCalled();
});
