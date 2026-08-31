import type { PersistedUiState } from '#ui/components/Table/utils/persistence.types';

import { isTableTotalsPlacement } from '#ui/components/Table/utils/isTableTotalsPlacement.util';

type ResolveLoaderTotalsPlacementArgs = {
  readonly param: null | string;
  readonly persisted: PersistedUiState['totalsPlacement'];
};

export const resolveLoaderTotalsPlacement = ({
  param,
  persisted,
}: ResolveLoaderTotalsPlacementArgs) => {
  if (isTableTotalsPlacement(param)) return param;

  return isTableTotalsPlacement(persisted) ? persisted : 'last';
};
