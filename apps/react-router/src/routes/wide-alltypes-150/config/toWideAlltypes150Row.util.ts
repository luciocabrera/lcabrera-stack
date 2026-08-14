import type { WideAlltypes150 } from '@/services';

import { serializeDatabaseValue } from './serializeDatabaseValue.util';

/**
 * Render one driver row the way this route's JSON endpoint rendered it, value
 * by value.
 *
 * The cast is the same unchecked contract `selectRows`'s own `TRow` parameter
 * is: 150 generated columns cannot be mapped field by field the way
 * `toCarSaleRow` maps three, and no runtime check the row could carry would be
 * cheaper than the read itself. What the cast asserts is that
 * `serializeDatabaseValue` leaves every value in the JSON shape
 * `WideAlltypes150` declares — which is what its own tests pin, per type.
 */
export const toWideAlltypes150Row = (row: Readonly<Record<string, unknown>>) =>
  Object.fromEntries(
    Object.entries(row).map(([column, value]) => [
      column,
      serializeDatabaseValue(value),
    ]),
  ) as unknown as WideAlltypes150;
