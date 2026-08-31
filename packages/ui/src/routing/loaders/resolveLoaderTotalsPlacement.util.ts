import type { TableTotalsPlacement } from '#ui/components/Table/Table.types';
import type { PersistedUiState } from '#ui/components/Table/utils/persistence.types';

import { isTableTotalsPlacement } from '#ui/components/Table/utils/isTableTotalsPlacement.util';

type ResolveLoaderTotalsPlacementArgs = {
  readonly param: null | string;
  readonly persisted: PersistedUiState['totalsPlacement'];
  readonly preference?: TableTotalsPlacement;
};

export const resolveLoaderTotalsPlacement = ({
  param,
  persisted,
  preference,
}: ResolveLoaderTotalsPlacementArgs) => {
  if (isTableTotalsPlacement(param)) return param;

  if (isTableTotalsPlacement(persisted)) return persisted;

  return isTableTotalsPlacement(preference) ? preference : 'last';
};
