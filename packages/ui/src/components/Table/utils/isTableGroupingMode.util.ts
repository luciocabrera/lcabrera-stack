import type { TableGroupingMode } from '../Table.types';

import { TABLE_GROUPING_MODE_LABELS } from '../Table.constants';

export const isTableGroupingMode = (
  value: unknown,
): value is TableGroupingMode =>
  typeof value === 'string' && Object.hasOwn(TABLE_GROUPING_MODE_LABELS, value);
