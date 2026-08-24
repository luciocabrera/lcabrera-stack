import type { PersistedUiState } from '#ui/components/Table/utils/persistence.types';

import { isTableTotalsPlacement } from '#ui/components/Table/utils/isTableTotalsPlacement.util';

type ResolveLoaderTotalsPlacementArgs = {
  readonly param: null | string;
  readonly persisted: PersistedUiState['totalsPlacement'];
};

/**
 * Both channels are client-controlled and the value reaches the direction of a
 * `GROUPING()` term in the emitted `ORDER BY`, so each is guarded and anything
 * unrecognised falls through to `last` rather than travelling.
 * `last` is also what `buildGroupOrderByClause` defaults to, so a route that never offers
 * the choice emits the SQL it emitted before this existed (#578).
 */
export const resolveLoaderTotalsPlacement = ({
  param,
  persisted,
}: ResolveLoaderTotalsPlacementArgs) => {
  if (isTableTotalsPlacement(param)) return param;

  return isTableTotalsPlacement(persisted) ? persisted : 'last';
};
