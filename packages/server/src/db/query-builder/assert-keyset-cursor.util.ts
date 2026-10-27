import type {
  ColumnReference,
  QueryCursor,
  QuerySort,
} from './query-builder.types.ts';

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
    throw new TypeError(
      `Keyset cursor names the joined column "${toColumnName(cursor.uniqueColumn)}" as its unique column; a cursor rests on a base-target column, written as a bare string.`,
    );
  }

  if (sort.length === 0) {
    throw new Error('Keyset pagination requires a sort; none was provided.');
  }

  if (cursor.values.length !== sort.length) {
    throw new Error(
      `Keyset cursor has ${cursor.values.length} value(s) but the sort has ${sort.length} column(s); they must correspond one to one, in order.`,
    );
  }

  const lastColumn = sort.at(-1)?.column;

  if (lastColumn !== cursor.uniqueColumn) {
    throw new Error(
      `Keyset pagination requires the sort to end on the unique column "${cursor.uniqueColumn}", but it ends on "${lastColumn === undefined ? '' : toColumnName(lastColumn)}".`,
    );
  }

  const lastValue = cursor.values.at(-1);

  if (lastValue === null || lastValue === undefined) {
    throw new Error(
      `Keyset cursor has no value for its unique column "${cursor.uniqueColumn}"; a nullable column cannot make a sort a total order.`,
    );
  }
};
