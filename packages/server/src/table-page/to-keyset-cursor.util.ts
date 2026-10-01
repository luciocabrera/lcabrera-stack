import type { QuerySort } from '../db/query-builder/query-builder.types.ts';

export type ToKeysetCursorArgs = {
  readonly cursor?: readonly unknown[];
  readonly sort: readonly QuerySort[];
  readonly uniqueColumn: string;
};

export const toKeysetCursor = ({
  cursor,
  sort,
  uniqueColumn,
}: ToKeysetCursorArgs) => {
  if (cursor === undefined || cursor.length !== sort.length) return;
  if (sort.at(-1)?.column !== uniqueColumn) return;

  const uniqueValue = cursor.at(-1);

  if (uniqueValue === null || uniqueValue === undefined) return;

  return { uniqueColumn, values: cursor };
};
