import type { LoaderFunctionArgs } from 'react-router';

import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { selectWideAlltypes150Page } from '@/routes/wide-alltypes-150/.server/wideAlltypes150.service';

import { loader } from './wide-alltypes-150-paginated.loader';

vi.mock('@/routes/wide-alltypes-150/.server/wideAlltypes150.service', () => ({
  selectWideAlltypes150Page: vi.fn(async () => ({
    data: [{ c_015: '3ab7', id: '1' }],
    hasMore: true,
    total: 1_000_000,
  })),
}));

const invokeLoader = (query: string) =>
  loader({
    request: new Request(
      `http://localhost/_api/wide-alltypes-150/paginated?${query}`,
    ),
  } as LoaderFunctionArgs);

beforeEach(() => {
  vi.mocked(selectWideAlltypes150Page).mockClear();
});

describe('wide-alltypes-150 paginated resource route', () => {
  it("turns the search params into the service's window and sort", async () => {
    await invokeLoader(
      'limit=50&skip=100&sort=[{"columnKey":"c_002","direction":"desc"}]',
    );

    expect(selectWideAlltypes150Page).toHaveBeenCalledWith({
      limit: 50,
      offset: 100,
      sorting: [{ columnKey: 'c_002', direction: 'desc' }],
    });
  });

  it('answers raw JSON, not the single-fetch protocol', async () => {
    const response = await invokeLoader('limit=1&skip=0');

    expect(response.headers.get('content-type')).toContain('application/json');
    expect(await response.json()).toStrictEqual({
      data: [{ c_015: '3ab7', id: '1' }],
      hasMore: true,
      total: 1_000_000,
    });
  });

  it('carries `total` on a page that is not the first', async () => {
    const response = await invokeLoader('limit=50&skip=950');

    expect(
      Object.keys((await response.json()) as object).toSorted((a, b) =>
        a.localeCompare(b),
      ),
    ).toContain('total');
  });
});
