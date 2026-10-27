/**
 * Private to `errors/`: the SQLSTATE codes `mapDbError` translates — Postgres' own
 * values, not names of ours — and the fixed sentence each refusal that can name a
 * request-supplied column serialises to.
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

export const GROUPING_REFUSED_MESSAGES: Readonly<
  Partial<Record<GroupingRefusalReason, string>>
> = {
  'duplicate-keys':
    'The request used the same column more than once among its group keys and column axis.',
  'unknown-column': 'The request named a column this grouped read cannot use.',
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
