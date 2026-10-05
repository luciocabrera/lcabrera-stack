import { describe, expect, it } from 'vite-plus/test';

import type {
  StandardSchemaV1,
  TableCellRenderer,
} from '#ui/components/Table/Table.types';

import { TABLE_CELL_BUILT_IN_RENDERERS } from './cellRenderers.constants';
import { mergeTableCellRenderers } from './mergeTableCellRenderers.util';
import { validateTableCellCall } from './validateTableCellCall.util';

const renderers = mergeTableCellRenderers([TABLE_CELL_BUILT_IN_RENDERERS]);

const withSchema = (schema: StandardSchemaV1<unknown, unknown>) =>
  new Map<string, TableCellRenderer>([
    ['x', { kind: 'x', params: schema, render: () => undefined }],
  ]);

describe('validateTableCellCall', () => {
  it('resolves a registered kind with params its schema accepts', () => {
    const outcome = validateTableCellCall({
      call: { kind: 'text', params: { weight: 'bold' } },
      renderers,
    });

    expect(outcome.status).toBe('resolved');
    expect(outcome.status === 'resolved' && outcome.params).toEqual({
      monospace: false,
      weight: 'bold',
    });
  });

  it('validates absent params as an empty object', () => {
    expect(
      validateTableCellCall({ call: { kind: 'text' }, renderers }).status,
    ).toBe('resolved');
  });

  it('reports an unregistered kind', () => {
    expect(
      validateTableCellCall({ call: { kind: 'gauge' }, renderers }),
    ).toEqual({ kind: 'gauge', status: 'unregistered' });
  });

  it('reports params the schema rejects, with its issues', () => {
    const outcome = validateTableCellCall({
      call: { kind: 'badge', params: { rules: 'nope' } },
      renderers,
    });

    expect(outcome).toEqual({
      issues: [{ message: 'rules must be an array', path: ['rules'] }],
      kind: 'badge',
      status: 'invalid',
    });
  });

  it('refuses a schema that only validates asynchronously', () => {
    const outcome = validateTableCellCall({
      call: { kind: 'x' },
      renderers: withSchema({
        '~standard': {
          validate: async () => ({ value: {} }),
          vendor: 'test',
          version: 1,
        },
      }),
    });

    expect(outcome.status).toBe('invalid');
  });

  it('turns a validator that throws into an invalid call', () => {
    const outcome = validateTableCellCall({
      call: { kind: 'x' },
      renderers: withSchema({
        '~standard': {
          validate: () => {
            throw new Error('boom');
          },
          vendor: 'test',
          version: 1,
        },
      }),
    });

    expect(outcome).toEqual({
      issues: [{ message: 'boom' }],
      kind: 'x',
      status: 'invalid',
    });
  });
});
