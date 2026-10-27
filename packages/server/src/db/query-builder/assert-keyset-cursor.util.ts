import type {
  ColumnReference,
  QueryCursor,
  QuerySort,
} from './query-builder.types.ts';

import { QueryRefusedError } from '../../errors/query-refused.error.ts';
import { toColumnName } from './to-column-name.util.ts';

type AssertKeysetCursorArgs = {
  readonly cursor: QueryCursor;
  readonly sort?: readonly QuerySort<ColumnReference>[];
};

export const assertKeysetCursor = ({
  cursor,
  sort = [],
}: AssertKeysetCursorArgs) => {
  if (typeof cursor.uniqueColumn !== 'string') {
    const column = toColumnName(cursor.uniqueColumn);

    throw new QueryRefusedError({
      column,
      message: `Keyset cursor names the joined column "${column}" as its unique column; a cursor rests on a base-target column, written as a bare string.`,
      reason: 'keyset-unique-column-joined',
    });
  }

  if (sort.length === 0) {
    throw new QueryRefusedError({
      message: 'Keyset pagination requires a sort; none was provided.',
      reason: 'keyset-sort-missing',
    });
  }

  if (cursor.values.length !== sort.length) {
    throw new QueryRefusedError({
      message: `Keyset cursor has ${cursor.values.length} value(s) but the sort has ${sort.length} column(s); they must correspond one to one, in order.`,
      reason: 'keyset-cursor-mismatch',
    });
  }

  const lastColumn = sort.at(-1)?.column;

  if (lastColumn !== cursor.uniqueColumn) {
    throw new QueryRefusedError({
      column: cursor.uniqueColumn,
      message: `Keyset pagination requires the sort to end on the unique column "${cursor.uniqueColumn}", but it ends on "${lastColumn === undefined ? '' : toColumnName(lastColumn)}".`,
      reason: 'keyset-sort-not-unique',
    });
  }

  const lastValue = cursor.values.at(-1);

  if (lastValue === null || lastValue === undefined) {
    throw new QueryRefusedError({
      column: cursor.uniqueColumn,
      message: `Keyset cursor has no value for its unique column "${cursor.uniqueColumn}"; a nullable column cannot make a sort a total order.`,
      reason: 'keyset-unique-value-missing',
    });
  }
};
