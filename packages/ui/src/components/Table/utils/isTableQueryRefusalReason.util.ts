import type { TableQueryRefusalReason } from '../Table.types';

const TABLE_QUERY_REFUSAL_REASONS: Record<TableQueryRefusalReason, true> = {
  'column-not-allowed': true,
  'keyset-cursor-mismatch': true,
  'keyset-sort-missing': true,
  'keyset-sort-not-unique': true,
  'keyset-unique-value-missing': true,
};

export const isTableQueryRefusalReason = (
  value: unknown,
): value is TableQueryRefusalReason =>
  typeof value === 'string' &&
  Object.hasOwn(TABLE_QUERY_REFUSAL_REASONS, value);
