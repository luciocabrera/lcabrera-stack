import type { WideAlltypes150 } from '@/services';

import { serializeDatabaseValue } from './serializeDatabaseValue.util';

export const toWideAlltypes150Row = (row: Readonly<Record<string, unknown>>) =>
  Object.fromEntries(
    Object.entries(row).map(([column, value]) => [
      column,
      serializeDatabaseValue(value),
    ]),
  ) as unknown as WideAlltypes150;
