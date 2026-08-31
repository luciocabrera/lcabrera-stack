import { INITIAL_PAGE_SIZE } from '@lcabrera/ui/components/Table/Table.constants';
import { describe, expect, it } from 'vite-plus/test';

import { MAX_WIDE_ALLTYPES_LIMIT } from '@/routes/wide-alltypes-150/config';

import { parseWideAlltypes150PageParams } from './parseWideAlltypes150PageParams.util';

const parse = (query: string) =>
  parseWideAlltypes150PageParams(new URLSearchParams(query));

describe('parseWideAlltypes150PageParams', () => {
  it('reads the window and the sort the table client sends', () => {
    expect(
      parse(
        'limit=50&skip=100&sort=[{"columnKey":"c_002","direction":"desc"}]',
      ),
    ).toStrictEqual({
      limit: 50,
      skip: 100,
      sorting: [{ columnKey: 'c_002', direction: 'desc' }],
    });
  });

  it('falls back to the table page size and the first page', () => {
    expect(parse('')).toStrictEqual({
      limit: INITIAL_PAGE_SIZE,
      skip: 0,
      sorting: [],
    });
  });

  it("clamps the window to the endpoint's ceiling", () => {
    expect(parse(`limit=${MAX_WIDE_ALLTYPES_LIMIT + 5000}`).limit).toBe(
      MAX_WIDE_ALLTYPES_LIMIT,
    );
  });

  it('never asks for a page of zero rows', () => {
    expect(parse('limit=0').limit).toBe(1);
  });

  it('ignores a sort param that is not JSON, or not a list', () => {
    expect(parse('sort=not-json').sorting).toStrictEqual([]);
    expect(parse('sort={"columnKey":"c_002"}').sorting).toStrictEqual([]);
  });

  it('leaves the unsortable point column for the service to drop', () => {
    expect(
      parse('sort=[{"columnKey":"c_018","direction":"asc"}]').sorting,
    ).toStrictEqual([{ columnKey: 'c_018', direction: 'asc' }]);
  });
});
