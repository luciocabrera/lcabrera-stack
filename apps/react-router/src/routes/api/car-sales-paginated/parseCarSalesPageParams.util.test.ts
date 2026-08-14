import { INITIAL_PAGE_SIZE } from '@lcabrera/ui/components/Table/Table.constants';
import { describe, expect, it } from 'vite-plus/test';

import { MAX_CAR_SALES_LIMIT } from '@/routes/car-sales/config';

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

  it('clamps the window to the endpoint ceiling', () => {
    // `/_api/car-sales/paginated` is public and unauthenticated over a 500k-row
    // table, so an uncapped `?limit=` is a whole-table read and a whole-table
    // JSON body. Asserting an OVER-cap request is what makes this test fail
    // without the clamp — a normal request passes either way (#701 review).
    expect(parse(`limit=${MAX_CAR_SALES_LIMIT + 1}`).limit).toBe(
      MAX_CAR_SALES_LIMIT,
    );
    expect(parse('limit=999999999').limit).toBe(MAX_CAR_SALES_LIMIT);
  });

  it('leaves a request at or below the ceiling untouched', () => {
    expect(parse(`limit=${MAX_CAR_SALES_LIMIT}`).limit).toBe(
      MAX_CAR_SALES_LIMIT,
    );
    expect(parse('limit=50').limit).toBe(50);
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
