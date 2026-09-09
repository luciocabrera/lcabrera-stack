import type { WideAlltypes150 } from '@/services';

import { serializeDatabaseValue } from './serializeDatabaseValue.util';
import { WIDE_ALLTYPES_COLUMNS } from './wideAlltypes150.constants';

export const toWideAlltypes150Row = (
  row: Readonly<Record<string, unknown>>,
) => {
  const missing = WIDE_ALLTYPES_COLUMNS.find(
    (column) => !Object.hasOwn(row, column),
  );

  if (missing !== undefined) {
    throw new Error(
      `wide_alltypes_150 row is missing required key "${missing}"`,
    );
  }

  return Object.fromEntries(
    WIDE_ALLTYPES_COLUMNS.map((column) => [
      column,
      serializeDatabaseValue(row[column]),
    ]),
  ) as WideAlltypes150;
};
