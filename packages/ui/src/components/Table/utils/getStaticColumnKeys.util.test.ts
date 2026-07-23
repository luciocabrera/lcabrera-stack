import { describe, expect, it } from 'vite-plus/test';

import type { TableColumn } from '../Table.types';

import { getStaticColumnKeys } from './getStaticColumnKeys.util';

type Row = { id: string; name: string };

const columns: TableColumn<Row>[] = [
  { dataType: 'string', isStatic: true, key: 'id', label: 'ID' },
  { dataType: 'string', key: 'name', label: 'Name' },
];

describe('getStaticColumnKeys', () => {
  it('returns a Set of keys for static columns', () => {
    const result = getStaticColumnKeys(columns);
    expect(result).toBeInstanceOf(Set);
    expect(result.has('id')).toBe(true);
    expect(result.has('name')).toBe(false);
  });

  it('returns empty Set when no static columns', () => {
    const nonStaticColumns: TableColumn<Row>[] = [
      { dataType: 'string', key: 'id', label: 'ID' },
    ];
    expect(getStaticColumnKeys(nonStaticColumns).size).toBe(0);
  });

  it('returns empty Set for empty columns array', () => {
    expect(getStaticColumnKeys([]).size).toBe(0);
  });
});
