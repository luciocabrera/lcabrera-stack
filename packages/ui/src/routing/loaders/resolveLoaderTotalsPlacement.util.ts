import type { TableTotalsPlacement } from '#ui/components/Table/Table.types';
import type { PersistedUiState } from '#ui/components/Table/utils/persistence.types';

import { isTableTotalsPlacement } from '#ui/components/Table/utils/isTableTotalsPlacement.util';

type ResolveLoaderTotalsPlacementArgs = {
  readonly param: null | string;
  readonly persisted: PersistedUiState['totalsPlacement'];
  /** The reader's Global Settings answer, which stands in for the shipped `last`. */
  readonly preference?: TableTotalsPlacement;
};

/**
 * The param wins over this table's cookie, which wins over the reader's global
 * preference, so a shared link opens the way its author saw it and an untouched table
 * opens the way its reader asked for.
 * All three channels are client-controlled and the value reaches a `GROUPING()` term in
 * the emitted `ORDER BY`, so each is guarded and anything unrecognised falls through to
 * `last`. `last` is also what `buildGroupOrderByClause` defaults to (#578).
 */
export const resolveLoaderTotalsPlacement = ({
  param,
  persisted,
  preference,
}: ResolveLoaderTotalsPlacementArgs) => {
  if (isTableTotalsPlacement(param)) return param;

  if (isTableTotalsPlacement(persisted)) return persisted;

  return isTableTotalsPlacement(preference) ? preference : 'last';
};
