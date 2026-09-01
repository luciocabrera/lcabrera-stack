import type { OlapDrillGroup } from '@lcabrera/api/olap/olap.types';

import type { OlapDrillRefusal } from './olap.types.ts';

type ResolveDrillRefusalArgs = {
  readonly group: OlapDrillGroup;
  readonly groupKeys: readonly string[];
};

export const resolveDrillRefusal = ({
  group,
  groupKeys,
}: ResolveDrillRefusalArgs): OlapDrillRefusal | undefined => {
  if (group.path.length === 0) return 'grand-total';
  if (group.isSubtotal) return 'subtotal';

  return group.path.length === groupKeys.length ? undefined : 'incomplete-path';
};
