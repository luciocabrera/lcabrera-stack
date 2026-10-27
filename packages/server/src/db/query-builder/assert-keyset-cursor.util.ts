import type { QueryCursor, QuerySort } from './query-builder.types.ts';

import { QueryRefusedError } from '../../errors/query-refused.error.ts';

type AssertKeysetCursorArgs = {
  readonly cursor: QueryCursor;
  readonly sort?: readonly QuerySort[];
};

export const assertKeysetCursor = ({
  cursor,
  sort = [],
}: AssertKeysetCursorArgs) => {
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
      message: `Keyset pagination requires the sort to end on the unique column "${cursor.uniqueColumn}", but it ends on "${lastColumn}".`,
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
