import { INITIAL_PAGE_SIZE } from '@lcabrera/ui/components/Table/Table.constants';
import { describe, expect, it } from 'vite-plus/test';

import { parseCarSalesPageParams } from './parseCarSalesPageParams.util';

const parse = (query: string) =>
  parseCarSalesPageParams(new URLSearchParams(query));

describe('parseCarSalesPageParams', () => {
  it('reads the window and the sort the table client sends', () => {
    expect(
      parse('limit=25&skip=50&sort=[{"columnKey":"model","direction":"desc"}]'),
    ).toStrictEqual({
      limit: 25,
      skip: 50,
      sorting: [{ columnKey: 'model', direction: 'desc' }],
    });
  });

  it('falls back to the table page size and the first page', () => {
    expect(parse('')).toStrictEqual({
      limit: INITIAL_PAGE_SIZE,
      skip: 0,
      sorting: [],
    });
  });

  it('never asks for a page of zero rows', () => {
    // `LIMIT 0` is an empty page whose `hasMore` says the set is exhausted —
    // a scroll session that ends without a word.
    expect(parse('limit=0').limit).toBe(1);
  });

  it('falls back rather than trusting a malformed window', () => {
    expect(parse('limit=abc&skip=-4')).toStrictEqual({
      limit: INITIAL_PAGE_SIZE,
      skip: 0,
      sorting: [],
    });
  });

  it('ignores a sort param that is not JSON, or not a list', () => {
    expect(parse('sort=not-json').sorting).toStrictEqual([]);
    expect(parse('sort={"columnKey":"model"}').sorting).toStrictEqual([]);
  });

  it('drops sort entries with no direction and the UI-only actions column', () => {
    expect(
      parse(
        'sort=[{"columnKey":"actions","direction":"asc"},{"columnKey":"model"},{"columnKey":"year","direction":"asc"}]',
      ).sorting,
    ).toStrictEqual([{ columnKey: 'year', direction: 'asc' }]);
  });
});
