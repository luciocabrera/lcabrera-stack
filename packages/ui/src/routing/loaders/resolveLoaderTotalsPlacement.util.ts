import type { PersistedUiState } from '#ui/components/Table/utils/persistence.types';

import { isTableTotalsPlacement } from '#ui/components/Table/utils/isTableTotalsPlacement.util';

type ResolveLoaderTotalsPlacementArgs = {
  readonly param: null | string;
  readonly persisted: PersistedUiState['totalsPlacement'];
};

/**
 * The param wins over the cookie, so a shared link opens the way its author saw it.
 * Both channels (search param and persisted cookie) are client-controlled and the value
 * reaches a `GROUPING()` term in the emitted `ORDER BY`, so each is guarded and anything
 * unrecognised falls through to `last`. `last` is also what `buildGroupOrderByClause`
 * defaults to (#578).
 */
export const resolveLoaderTotalsPlacement = ({
  param,
  persisted,
}: ResolveLoaderTotalsPlacementArgs) => {
  if (isTableTotalsPlacement(param)) return param;

  return isTableTotalsPlacement(persisted) ? persisted : 'last';
};
