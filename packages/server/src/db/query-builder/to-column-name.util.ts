import type { ColumnReference } from './query-builder.types.ts';

export const toColumnName = (reference: ColumnReference) =>
  typeof reference === 'string'
    ? reference
    : `${reference.source}.${reference.column}`;
