import type { TableTotalsPlacement } from '../Table.types';

import { TABLE_TOTALS_PLACEMENT_LABELS } from '../Table.constants';

export const isTableTotalsPlacement = (
  value: unknown,
): value is TableTotalsPlacement =>
  typeof value === 'string' &&
  Object.hasOwn(TABLE_TOTALS_PLACEMENT_LABELS, value);
