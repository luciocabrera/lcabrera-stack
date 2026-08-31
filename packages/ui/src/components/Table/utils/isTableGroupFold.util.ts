import type { TableGroupFold } from '../Table.types';

import { TABLE_GROUP_FOLD_LABELS } from '../Table.constants';

export const isTableGroupFold = (value: unknown): value is TableGroupFold =>
  typeof value === 'string' && Object.hasOwn(TABLE_GROUP_FOLD_LABELS, value);
