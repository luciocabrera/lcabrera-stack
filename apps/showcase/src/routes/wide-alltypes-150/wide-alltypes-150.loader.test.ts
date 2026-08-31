import type { LoaderFunctionArgs } from 'react-router';

import { INITIAL_PAGE_SIZE } from '@lcabrera/ui/components/Table/Table.constants';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { loader } from './wide-alltypes-150.loader';

const { readWideAlltypes150PageMock, resolveCapabilitiesMock } = vi.hoisted(
  () => ({
    readWideAlltypes150PageMock: vi.fn(() =>
      Promise.resolve({ data: [], hasMore: false, total: 0 }),
    ),
    resolveCapabilitiesMock: vi.fn(() => Promise.resolve([])),
  }),
);

vi.mock('./.server/wideAlltypes150.service', () => ({
  readWideAlltypes150Page: readWideAlltypes150PageMock,
  selectWideAlltypes150GroupingCapabilities: resolveCapabilitiesMock,
}));

const invokeLoader = async (search = '') =>
  loader({
    request: new Request(`http://localhost/wide-alltypes-150${search}`),
  } as LoaderFunctionArgs);

beforeEach(() => {
  readWideAlltypes150PageMock.mockClear();
  resolveCapabilitiesMock.mockClear();
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
    await invokeLoader();

    expect(readWideAlltypes150PageMock).toHaveBeenCalledWith(
      expect.objectContaining({
        sorting: [{ columnKey: 'id', direction: 'asc' }],
      }),
    );
  });

  describe('grouping', () => {
    it('declares the capability so the table offers grouping at all', async () => {
      const { metaState } = await invokeLoader();

      expect(metaState.isGroupingEnabled).toBe(true);
    });

    it('forwards a sanitized grouping to its own server service', async () => {
      await invokeLoader(
        `?grouping=${encodeURIComponent('{"keys":["c_001"]}')}`,
      );

      expect(readWideAlltypes150PageMock).toHaveBeenCalledWith(
        expect.objectContaining({
          grouping: expect.objectContaining({ keys: ['c_001'] }),
        }),
      );
    });

    it('degrades a malformed param to grouping off, not to a half-applied read', async () => {
      const { metaState } = await invokeLoader(
        `?grouping=${encodeURIComponent('{"keys":["c_001",1]}')}`,
      );

      expect(metaState.groupingKeys).toEqual([]);
    });

    it('drops a key naming no column this route declares', async () => {
      const { metaState } = await invokeLoader(
        `?grouping=${encodeURIComponent('{"keys":["not_a_column"]}')}`,
      );

      expect(metaState.groupingKeys).toEqual([]);
    });

    it('resolves each column’s real capability from the catalogue', async () => {
      await invokeLoader();

      expect(resolveCapabilitiesMock).toHaveBeenCalledTimes(1);
    });
  });
});
