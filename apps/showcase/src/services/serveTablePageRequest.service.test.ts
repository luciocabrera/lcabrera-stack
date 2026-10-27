import { INITIAL_PAGE_SIZE } from '@lcabrera/ui/components/Table/Table.constants';
import { describe, expect, it, vi } from 'vite-plus/test';

import type { TablePageWindow } from './serveTablePageRequest.service';

import { serveTablePageRequest } from './serveTablePageRequest.service';

const FALLBACK_SORT = [{ columnKey: 'id', direction: 'asc' }] as const;
const MAX_LIMIT = 100;

const serve = async (query: string) => {
  const selectPage = vi.fn(async (window: TablePageWindow) => ({
    data: [],
    window,
  }));
  const response = await serveTablePageRequest({
    fallbackSort: FALLBACK_SORT,
    maxLimit: MAX_LIMIT,
    request: new Request(`http://localhost/rows/page?${query}`),
    selectPage,
  });

  return { response, selectPage };
};

describe('serveTablePageRequest', () => {
  it('reads the window and sort a page request carries', async () => {
    const { selectPage } = await serve(
      'limit=25&skip=50&sort=[{"columnKey":"name","direction":"desc"}]',
    );

    expect(selectPage).toHaveBeenCalledWith({
      limit: 25,
      offset: 50,
      sorting: [{ columnKey: 'name', direction: 'desc' }],
    });
  });

  it('falls back to the table page size, the first page and the fallback order', async () => {
    const { selectPage } = await serve('');

    expect(selectPage).toHaveBeenCalledWith({
      limit: INITIAL_PAGE_SIZE,
      offset: 0,
      sorting: FALLBACK_SORT,
    });
  });

  it('clamps the window to the ceiling, and raises a zero window to one row', async () => {
    const wide = await serve('limit=999999999');
    const empty = await serve('limit=0');

    expect(wide.selectPage.mock.calls[0]?.[0].limit).toBe(MAX_LIMIT);
    expect(empty.selectPage.mock.calls[0]?.[0].limit).toBe(1);
  });

  it('drops a sort on the row-actions column', async () => {
    const { selectPage } = await serve(
      'sort=[{"columnKey":"actions","direction":"asc"}]',
    );

    expect(selectPage.mock.calls[0]?.[0].sorting).toStrictEqual(FALLBACK_SORT);
  });

  it('answers the page as raw JSON', async () => {
    const { response } = await serve('limit=1&skip=0');

    expect(response.headers.get('content-type')).toContain('application/json');
    expect(await response.json()).toStrictEqual({
      data: [],
      window: {
        limit: 1,
        offset: 0,
        sorting: [{ columnKey: 'id', direction: 'asc' }],
      },
    });
  });

  it('refuses an unreadable filter instead of reading every row', async () => {
    const { response, selectPage } = await serve('filter=not-json');

    expect(selectPage).not.toHaveBeenCalled();
    expect(await response.json()).toStrictEqual(
      expect.objectContaining({
        data: [],
        error: expect.objectContaining({ kind: 'unexpected' }),
        hasMore: false,
      }),
    );
  });
});
