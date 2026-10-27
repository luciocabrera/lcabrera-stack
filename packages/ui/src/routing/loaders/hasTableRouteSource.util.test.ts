import { describe, expect, it } from 'vite-plus/test';

import { hasTableRouteSource } from './hasTableRouteSource.util';

type Page = { readonly data: readonly Row[] };
type Row = { readonly id: number };

const fetchPage = async (): Promise<Page> => ({ data: [] });

describe('hasTableRouteSource', () => {
  it('is true for loader settings that name a source', () => {
    expect(
      hasTableRouteSource<Row, Page>({
        source: { fetchPage, pagePath: '/rows/page', tableName: 'rows' },
      }),
    ).toBe(true);
  });

  it('is false for loader settings that pass their own fetchPage and table name', () => {
    expect(
      hasTableRouteSource<Row, Page>({ fetchPage, tableName: 'rows' }),
    ).toBe(false);
  });
});
