import type { PersistedUiState } from '#ui/components/Table/utils/persistence.types';

import { isTableTotalsPlacement } from '#ui/components/Table/utils/isTableTotalsPlacement.util';

type ResolveLoaderTotalsPlacementArgs = {
  readonly param: null | string;
  readonly persisted: PersistedUiState['totalsPlacement'];
};

/**
 * The totals placement a loader run applies: the URL's, the cookie's, or the
 * default.
 *
 * **The param wins over the cookie**, because a link is an explicit statement
 * about one table while the cookie is a standing preference — so a shared link
 * opens the way its author saw it, and the reader's own preference is what any
 * URL that says nothing falls back to.
 *
 * Both channels are client-controlled and the value reaches the direction of a
 * `GROUPING()` term in the emitted `ORDER BY`, so each is guarded and anything
 * unrecognised falls through to `last` rather than travelling. `last` is also
 * what `buildGroupOrderByClause` defaults to, so a route that never offers the
 * choice emits the SQL it emitted before this existed (#578).
 */
export const resolveLoaderTotalsPlacement = ({
  param,
  persisted,
}: ResolveLoaderTotalsPlacementArgs) => {
  if (isTableTotalsPlacement(param)) return param;

  return isTableTotalsPlacement(persisted) ? persisted : 'last';
};
