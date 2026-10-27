import { describe, expect, it } from 'vite-plus/test';

import { resolveTableRouteSource } from './resolveTableRouteSource.util';

type Row = { readonly id: number };

const fetchPage = async () => ({ data: [] });

describe('resolveTableRouteSource', () => {
  it('returns the source a loader was given', () => {
    const source = {
      capabilities: { isKeysetEnabled: true },
      fetchPage,
      pagePath: '/rows/page',
      tableName: 'rows',
    };

    expect(resolveTableRouteSource<Row, { data: never[] }>({ source })).toBe(
      source,
    );
  });

  it('treats the loader’s own fetchPage and table name as the source when it names none', () => {
    const resolved = resolveTableRouteSource<Row, { data: never[] }>({
      fetchPage,
      schemaName: 'public',
      tableName: 'rows',
    });

    expect(resolved).toStrictEqual({
      fetchPage,
      schemaName: 'public',
      tableName: 'rows',
    });
    expect(resolved.capabilities).toBeUndefined();
    expect(resolved.pagePath).toBeUndefined();
  });
});
