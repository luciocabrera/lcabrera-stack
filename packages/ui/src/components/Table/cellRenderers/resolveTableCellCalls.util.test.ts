import { describe, expect, it } from 'vite-plus/test';

import type { TableColumn } from '#ui/components/Table/Table.types';

import { TABLE_CELL_BUILT_IN_RENDERERS } from './cellRenderers.constants';
import { mergeTableCellRenderers } from './mergeTableCellRenderers.util';
import { resolveTableCellCalls } from './resolveTableCellCalls.util';

type Row = { readonly name: string; readonly score: number };

const renderers = mergeTableCellRenderers([TABLE_CELL_BUILT_IN_RENDERERS]);

describe('resolveTableCellCalls', () => {
  it('validates each column that carries a call, once, by key', () => {
    const columns: TableColumn<Row>[] = [
      { cell: { kind: 'text' }, key: 'name', label: 'Name' },
      { key: 'score', label: 'Score' },
    ];
    const outcomes = resolveTableCellCalls({ columns, renderers });

    expect(outcomes.keys().toArray()).toEqual(['name']);
    expect(outcomes.get('name')?.status).toBe('resolved');
  });

  it('answers an empty map for columns without calls', () => {
    expect(
      resolveTableCellCalls<Row>({
        columns: [{ key: 'name', label: 'Name' }],
        renderers,
      }).size,
    ).toBe(0);
  });
});
