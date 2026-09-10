import {
  useGetTableIsGroupingEnabled,
  useGetTableIsGroupingLocked,
} from '#ui/components/Table/contexts/TableConfig/meta/selectors';

import { useGetGroupingMode } from '../../TableDrawerContext/selectors';

export const useHasAdvancedSettings = () => {
  const isGroupingEnabled = useGetTableIsGroupingEnabled();
  const isGroupingLocked = useGetTableIsGroupingLocked();
  const mode = useGetGroupingMode();

  if (!isGroupingEnabled) return false;

  return !isGroupingLocked || mode === 'rollup';
};
