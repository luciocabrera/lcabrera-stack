import type { TableGroupingRefusalReason } from '../Table.types';

const TABLE_GROUPING_REFUSAL_REASONS: Record<TableGroupingRefusalReason, true> =
  {
    'aggregate-not-legal': true,
    'column-axis-too-wide': true,
    'column-not-groupable': true,
    'duplicate-keys': true,
    'estimate-too-large': true,
    'no-keys': true,
    'row-limit-reached': true,
    'too-many-keys': true,
    'unknown-column': true,
  };

export const isTableGroupingRefusalReason = (
  value: unknown,
): value is TableGroupingRefusalReason =>
  typeof value === 'string' &&
  Object.hasOwn(TABLE_GROUPING_REFUSAL_REASONS, value);
