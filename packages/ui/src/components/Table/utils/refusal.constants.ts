import type {
  TableGroupingRefusalReason,
  TableQueryRefusalReason,
} from '../Table.types';

export const TABLE_GROUPING_REFUSAL_REASONS: Readonly<
  Record<TableGroupingRefusalReason, true>
> = {
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

export const TABLE_QUERY_REFUSAL_REASONS: Readonly<
  Record<TableQueryRefusalReason, true>
> = {
  'column-not-allowed': true,
  'keyset-cursor-mismatch': true,
  'keyset-sort-missing': true,
  'keyset-sort-not-unique': true,
  'keyset-unique-value-missing': true,
};
