import type { TableColumn } from '@repo/ui/components/Table/Table.types';

import { describe, expect, it } from 'vitest';

import { validateTableCrudConfig } from './validateTableCrudConfig.util';

type Row = {
  readonly id: number;
  readonly name: string;
};

const idColumn: TableColumn<Row> = {
  isPrimaryKey: true,
  key: 'id',
  label: 'Id',
};
const nameColumn: TableColumn<Row> = { key: 'name', label: 'Name' };

describe('validateTableCrudConfig', () => {
  it('is a no-op when crud is undefined', () => {
    expect(() =>
      validateTableCrudConfig<Row>({ columns: [idColumn] }),
    ).not.toThrow();
  });

  it('throws when no operation is enabled', () => {
    expect(() =>
      validateTableCrudConfig<Row>({ columns: [idColumn], crud: {} }),
    ).toThrow(TypeError);
  });

  it('allows a create-only config without a primary key', () => {
    expect(() =>
      validateTableCrudConfig<Row>({
        columns: [nameColumn],
        crud: { create: true },
      }),
    ).not.toThrow();
  });

  it('throws when read/update/delete is enabled without a primary key', () => {
    expect(() =>
      validateTableCrudConfig<Row>({
        columns: [nameColumn],
        crud: { read: true },
      }),
    ).toThrow(TypeError);
  });

  it('throws when delete is enabled without a deleteActionPath', () => {
    expect(() =>
      validateTableCrudConfig<Row>({
        columns: [idColumn],
        crud: { delete: true },
      }),
    ).toThrow(TypeError);
  });

  it('passes for a valid full config', () => {
    expect(() =>
      validateTableCrudConfig<Row>({
        columns: [idColumn],
        crud: { create: true, delete: true, read: true, update: true },
        deleteActionPath: '/_action/rows/delete',
      }),
    ).not.toThrow();
  });
});
