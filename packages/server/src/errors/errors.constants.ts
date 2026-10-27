/**
 * Private to `errors/`: the SQLSTATE codes `mapDbError` translates — Postgres' own
 * values, not names of ours — and the fixed sentence each refusal reason serialises to.
 * Exporting a growing catalogue of SQLSTATEs from a published package would be surface
 * with no behaviour behind it.
 */
import type {
  GroupingRefusalReason,
  QueryRefusalReason,
} from './errors.types.ts';

export const SQLSTATE_FOREIGN_KEY_VIOLATION = '23503';
export const SQLSTATE_UNIQUE_VIOLATION = '23505';
export const SQLSTATE_QUERY_CANCELED = '57014';

export const GROUPING_REFUSALS: Readonly<
  Record<
    GroupingRefusalReason,
    { readonly echoesColumn: boolean; readonly message: string }
  >
> = {
  'aggregate-not-legal': {
    echoesColumn: true,
    message:
      "The request asked for aggregates this grouped read cannot compute: it needs at least one, at most one distinct count, a column for every function but count, and a function the column's type supports.",
  },
  'column-axis-too-wide': {
    echoesColumn: true,
    message:
      'The column axis has more distinct values than the read can turn into columns.',
  },
  'column-not-groupable': {
    echoesColumn: true,
    message:
      'The request grouped by a column in a way its type does not support.',
  },
  'duplicate-keys': {
    echoesColumn: false,
    message:
      'The request named the same column more than once among its group keys and column axis.',
  },
  'estimate-too-large': {
    echoesColumn: true,
    message:
      'This grouping is estimated to return more rows than the read allows. Group by fewer columns or filter the rows down.',
  },
  'no-keys': {
    echoesColumn: false,
    message: 'The request asked for a grouped read with no group key.',
  },
  'row-limit-reached': {
    echoesColumn: false,
    message:
      'This grouping returned more rows than the read allows, and the table has no statistics to estimate it from. Group by fewer columns or filter the rows down.',
  },
  'too-many-keys': {
    echoesColumn: false,
    message:
      'The request named more group keys than this kind of grouping takes.',
  },
  'unknown-column': {
    echoesColumn: false,
    message:
      "The request named a column this grouped read cannot resolve: one the read does not allow, one the table's catalogue does not describe, or a granularity for a column that is not a group key.",
  },
};

export const QUERY_REFUSED_MESSAGES: Readonly<
  Record<QueryRefusalReason, string>
> = {
  'column-not-allowed': 'The request named a column this query does not allow.',
  'group-filter-alias-unknown':
    'The request filtered groups by an aggregate the read does not declare.',
  'group-filter-column-axis':
    'The request filtered groups on a read with a column axis.',
  'group-filter-grouping-unsupported':
    'The request filtered groups on a read with subtotals.',
  'group-filter-operator-unsupported':
    'The request filtered groups with an operator an aggregate does not take.',
  'join-alias-taken': 'The request gave two sources of the read the same name.',
  'join-allowlist-missing':
    'The request joined a table without an allowed-column list for every table it reaches.',
  'join-ambiguous':
    'The request joined along columns that more than one foreign key uses.',
  'join-kind-unsupported':
    'The request asked for a join other than an inner or a left join.',
  'join-not-declared':
    'The request joined along a foreign key the schema does not declare.',
  'join-relations-missing':
    'The request joined a table without the relation map the join is checked against.',
  'join-source-unknown': 'The request named a source the read does not join.',
  'keyset-cursor-mismatch':
    'The request sent a cursor that does not match its sort.',
  'keyset-sort-missing': 'The request sent a cursor without a sort.',
  'keyset-sort-not-unique':
    'The request sent a cursor with a sort that does not end on the unique column.',
  'keyset-unique-column-joined':
    'The request sent a cursor whose unique column is not on the base table.',
  'keyset-unique-value-missing':
    'The request sent a cursor with no value for the unique column.',
  'projected-alias-too-long':
    'The request projected a joined column under a name longer than the database keeps.',
};
