import { isObject } from '@lcabrera/utils/guards/is-object.util';

import { isTableGroupFold } from '#ui/components/Table/utils/isTableGroupFold.util';
import { isTableGroupingMode } from '#ui/components/Table/utils/isTableGroupingMode.util';
import { isTableTotalsPlacement } from '#ui/components/Table/utils/isTableTotalsPlacement.util';

export const toGlobalGroupingPreferences = (value: unknown) => {
  if (!isObject(value)) {
    return;
  }

  const defaultFold = isTableGroupFold(value.defaultFold)
    ? value.defaultFold
    : undefined;
  const mode = isTableGroupingMode(value.mode) ? value.mode : undefined;
  const totalsPlacement = isTableTotalsPlacement(value.totalsPlacement)
    ? value.totalsPlacement
    : undefined;

  return { defaultFold, mode, totalsPlacement };
};
