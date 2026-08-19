import { useGetTableIsGroupDrillEnabled } from '#ui/components/Table/contexts/TableConfig/meta/selectors';
import { useTableConfigContextValue } from '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';

import { canDrillGroups } from '../utils/canDrillGroups.util';

/**
 * Whether this table can drill at all — the route's capability **and** the
 * fetcher that reaches it, which are two different answers (ADR-063, ADR-079).
 *
 * It is a hook rather than a store selector because only half of it is store
 * state: `isGroupDrillEnabled` is on the meta store, and `onDrillGroup` is a
 * prop held on the config context, since a function cannot travel as loader data
 * (ADR-009). Composing the two here means every reader asks one question and
 * they cannot disagree about whether a row is drillable.
 */
export const useGetTableCanDrillGroups = () => {
  const isGroupDrillEnabled = useGetTableIsGroupDrillEnabled();
  const { onDrillGroup } = useTableConfigContextValue();

  return canDrillGroups({ isGroupDrillEnabled, onDrillGroup });
};
