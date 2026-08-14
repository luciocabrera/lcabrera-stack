import type { LoaderFunctionArgs } from 'react-router';

import { INITIAL_PAGE_SIZE } from '@lcabrera/ui/components/Table/Table.constants';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { loader } from './wide-alltypes-150.loader';

const { readWideAlltypes150PageMock } = vi.hoisted(() => ({
  readWideAlltypes150PageMock: vi.fn(() =>
    Promise.resolve({ data: [], hasMore: false, total: 0 }),
  ),
}));

vi.mock('./.server/wideAlltypes150.service', () => ({
  readWideAlltypes150Page: readWideAlltypes150PageMock,
}));

const invokeLoader = async () =>
  loader({
    request: new Request('http://localhost/wide-alltypes-150'),
  } as LoaderFunctionArgs);

beforeEach(() => {
  readWideAlltypes150PageMock.mockClear();
});

describe('wide-alltypes-150 loader', () => {
  it("reads its first page through the route's own server service", async () => {
    await invokeLoader();

    expect(readWideAlltypes150PageMock).toHaveBeenCalledTimes(1);
    expect(readWideAlltypes150PageMock).toHaveBeenCalledWith(
      expect.objectContaining({ limit: INITIAL_PAGE_SIZE, skip: 0 }),
    );
  });

  it('ships 150 columns carrying no function values', async () => {
    // Single fetch replaces a function with `undefined` silently (ADR-009), so
    // a `render` or a filter adapter added here would vanish without a word.
    const { columnsState } = await invokeLoader();

    const withFunctions = columnsState.columns.filter((column) =>
      Object.values(column).some((value) => typeof value === 'function'),
    );

    expect(withFunctions).toEqual([]);
    expect(columnsState.columns).toHaveLength(150);
  });

  it('leaves the columns undecorated — this route bakes no filter descriptors', async () => {
    const { columnsState } = await invokeLoader();

    expect(
      columnsState.columns.filter(
        (column) => column.filterOptionsDescriptor !== undefined,
      ),
    ).toEqual([]);
  });

  it('carries the primary-key tiebreaker into the sort it asks for', async () => {
    // `createTableRouteLoader` appends it (ADR-008); without it page 2 is
    // ordered differently from page 1 and rows repeat across the boundary.
    await invokeLoader();

    expect(readWideAlltypes150PageMock).toHaveBeenCalledWith(
      expect.objectContaining({
        sorting: [{ columnKey: 'id', direction: 'asc' }],
      }),
    );
  });
});
