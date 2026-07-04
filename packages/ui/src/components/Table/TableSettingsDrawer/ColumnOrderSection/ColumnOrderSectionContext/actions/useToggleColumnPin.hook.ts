import type { DataKey } from '@repo/ui/components/Table/Table.types';

import { useTableConfigContextValue } from '@repo/ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { useTableDrawerContextValue } from '@repo/ui/components/Table/TableSettingsDrawer/TableDrawerContext/useTableDrawerContextValue.hook';
import { useGetGlobalPinSidePreference } from '@repo/ui/contexts/GlobalSettingsContext/selectors/useGetGlobalPinSidePreference.hook';
import { useGetGlobalUnpinConflictResolutionPreference } from '@repo/ui/contexts/GlobalSettingsContext/selectors/useGetGlobalUnpinConflictResolutionPreference.hook';

import { useColumnOrderSectionContextValue } from '../useColumnOrderSectionContextValue.hook';
import { useAcceptPinSide } from './useAcceptPinSide.hook';
import { useAcceptUnpinConflict } from './useAcceptUnpinConflict.hook';
import { applyToggleColumnPinResolution } from './utils/applyToggleColumnPinResolution.util';
import { resolveToggleColumnPinUpdate } from './utils/resolveToggleColumnPinUpdate.util';

type UseToggleColumnPinArgs = {
  readonly columnKey: DataKey<Record<string, unknown>>;
  readonly isPinning: boolean;
};
/**
 * Hook to toggle column pinning on/off.
 * Opens the appropriate modal when conflicts are detected.
 */
export const useToggleColumnPin = () => {
  const { columnsStore: tableColumnsStore } = useTableConfigContextValue();
  const { columnsStore: drawerColumnsStore } = useTableDrawerContextValue();
  const { modalsStore } = useColumnOrderSectionContextValue();
  const globalPinSidePreference = useGetGlobalPinSidePreference();
  const globalUnpinConflictResolutionPreference =
    useGetGlobalUnpinConflictResolutionPreference();
  const acceptPinSide = useAcceptPinSide();
  const acceptUnpinConflict = useAcceptUnpinConflict();

  return ({ columnKey, isPinning }: UseToggleColumnPinArgs) => {
    const tableColumnsState = tableColumnsStore.get();
    const columns = tableColumnsState?.columns ?? [];
    const column = tableColumnsState?.normalizedColumns[columnKey];
    const isColumnStatic = column?.isStatic ?? false;
    const staticKeys = tableColumnsState?.staticKeys;

    const drawerState = drawerColumnsStore.get();
    const columnPinning = drawerState?.columnPinning ?? { left: [], right: [] };
    const columnsOrder = drawerState?.columnOrder ?? [];

    const resolution = resolveToggleColumnPinUpdate({
      columnKey,
      columnPinning,
      columns,
      columnsOrder,
      globalPinSidePreference,
      globalUnpinConflictResolutionPreference,
      isColumnStatic,
      isPinning,
      staticKeys,
    });

    applyToggleColumnPinResolution({
      acceptPinSide,
      acceptUnpinConflict,
      resolution,
      setColumnPinning: (nextPinning) => {
        drawerColumnsStore.set({ columnPinning: nextPinning });
      },
      setPinSideModal: (modal) => {
        modalsStore.set({ pinSideModal: modal });
      },
      setUnpinConflictModal: (modal) => {
        modalsStore.set({ unpinConflictModal: modal });
      },
    });
  };
};
