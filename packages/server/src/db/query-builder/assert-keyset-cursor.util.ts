import type { QueryCursor, QuerySort } from './query-builder.types.ts';

type AssertKeysetCursorArgs = {
  readonly cursor: QueryCursor;
  readonly sort?: readonly QuerySort[];
};

/**
 * Refuses a keyset cursor the builder cannot resume correctly, at construction time — the
 * same posture as buildUpdateQuery/buildDeleteQuery refusing an unfiltered mutation.
 * Whether that column is genuinely unique is the caller's to guarantee (ADR-052).
 */
export const assertKeysetCursor = ({
  cursor,
  sort = [],
}: AssertKeysetCursorArgs): void => {
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
      `Keyset pagination requires the sort to end on the unique column "${cursor.uniqueColumn}", but it ends on "${lastColumn}".`,
    );
  }

  const lastValue = cursor.values.at(-1);

  if (lastValue === null || lastValue === undefined) {
    throw new Error(
      `Keyset cursor has no value for its unique column "${cursor.uniqueColumn}"; a nullable column cannot make a sort a total order.`,
    );
  }
};
