import type { TableGroupFold } from '../Table.types';

import { TABLE_GROUP_FOLD_LABELS } from '../Table.constants';

/**
 * Tested against `TABLE_GROUP_FOLD_LABELS`, a map closed over `TableGroupFold`, so the
 * guard is total by construction — the same shape `isTableGroupingMode` and
 * `isTableTotalsPlacement` use.
 * It guards the settings cookie, which is client-controlled, and the value decides which
 * rows a first paint shows — so an unrecognised token has to fall back rather than travel.
 */
export const isTableGroupFold = (value: unknown): value is TableGroupFold =>
  typeof value === 'string' && Object.hasOwn(TABLE_GROUP_FOLD_LABELS, value);
