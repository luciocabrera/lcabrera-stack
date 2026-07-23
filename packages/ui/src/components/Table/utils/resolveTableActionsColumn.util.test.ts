import { describe, expect, it } from 'vite-plus/test';

import type { TableColumn } from '../Table.types';

import { resolveTableActionsColumn } from './resolveTableActionsColumn.util';

type Row = {
  id: number;
  name: string;
};

const baseColumns: TableColumn<Row>[] = [
  { dataType: 'number', key: 'id', label: 'ID' },
  { dataType: 'string', key: 'name', label: 'Name' },
];

describe('resolveTableActionsColumn', () => {
  it('returns columns unchanged and hasActionsColumn=false when crud is undefined and no actions column is declared', () => {
    const result = resolveTableActionsColumn<Row>({ columns: baseColumns });

    expect(result.columns).toEqual(baseColumns);
    expect(result.hasActionsColumn).toBe(false);
  });

  it('does not add an actions column when only crud.create is enabled', () => {
    const result = resolveTableActionsColumn<Row>({
      columns: baseColumns,
      crud: { create: true },
    });

    expect(result.columns.some((column) => column.key === 'actions')).toBe(
      false,
    );
    expect(result.hasActionsColumn).toBe(false);
  });

  it('adds the default actions column when crud.read is enabled', () => {
    const result = resolveTableActionsColumn<Row>({
      columns: baseColumns,
      crud: { read: true },
    });

    expect(
      result.columns.find((column) => column.key === 'actions'),
    ).toMatchObject({
      isStatic: true,
      key: 'actions',
      label: 'Actions',
    });
    expect(result.hasActionsColumn).toBe(true);
  });

  it('adds the default actions column when crud.update is enabled', () => {
    const result = resolveTableActionsColumn<Row>({
      columns: baseColumns,
      crud: { update: true },
    });

    expect(
      result.columns.find((column) => column.key === 'actions'),
    ).toMatchObject({
      key: 'actions',
    });
    expect(result.hasActionsColumn).toBe(true);
  });

  it('adds the default actions column when crud.delete is enabled', () => {
    const result = resolveTableActionsColumn<Row>({
      columns: baseColumns,
      crud: { delete: true },
    });

    expect(
      result.columns.find((column) => column.key === 'actions'),
    ).toMatchObject({
      key: 'actions',
    });
    expect(result.hasActionsColumn).toBe(true);
  });

  it('merges a consumer-declared partial actions column with defaults, even without crud', () => {
    const render = (row: Row) => row.name;
    const result = resolveTableActionsColumn<Row>({
      columns: [...baseColumns, { key: 'actions', label: 'Custom', render }],
    });

    const actionsColumn = result.columns.find(
      (column) => column.key === 'actions',
    );

    expect(actionsColumn?.label).toBe('Custom');
    expect(actionsColumn?.render).toBe(render);
    expect(actionsColumn?.isStatic).toBe(true);
    expect(result.hasActionsColumn).toBe(true);
  });

  it('never duplicates the actions column', () => {
    const result = resolveTableActionsColumn<Row>({
      columns: [...baseColumns, { key: 'actions', label: 'Custom' }],
      crud: { delete: true },
    });

    expect(
      result.columns.filter((column) => column.key === 'actions'),
    ).toHaveLength(1);
  });
});
