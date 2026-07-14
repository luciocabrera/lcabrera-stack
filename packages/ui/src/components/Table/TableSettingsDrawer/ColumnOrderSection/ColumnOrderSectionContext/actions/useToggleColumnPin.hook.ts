import type { DataKey } from '@repo/ui/components/Table/Table.types';

import { useTableConfigContextValue } from '@repo/ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { useTableDrawerContextValue } from '@repo/ui/components/Table/TableSettingsDrawer/TableDrawerContext/useTableDrawerContextValue.hook';
import { useGlobalSettingsContextValue } from '@repo/ui/contexts/GlobalSettingsContext/useGlobalSettingsContextValue.hook';

import { useColumnOrderSectionContextValue } from '../useColumnOrderSectionContextValue.hook';
import { useAcceptPinSide } from './useAcceptPinSide.hook';
import { useAcceptUnpinConflict } from './useAcceptUnpinConflict.hook';
import { applyToggleColumnPinResolution } from './utils/applyToggleColumnPinResolution.util';
import { readPinActionState } from './utils/readPinActionState.util';
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
  const { settingsStore } = useGlobalSettingsContextValue();
  const acceptPinSide = useAcceptPinSide();
  const acceptUnpinConflict = useAcceptUnpinConflict();

  return ({ columnKey, isPinning }: UseToggleColumnPinArgs) => {
    const tableColumnsState = tableColumnsStore.get();
    const { columnPinning, columns, columnsOrder, staticKeys } =
      readPinActionState({
        drawerState: drawerColumnsStore.get(),
        tableState: tableColumnsState,
      });
    const isColumnStatic =
      tableColumnsState?.normalizedColumns[columnKey]?.isStatic ?? false;

    const globalSettingsState = settingsStore.get();
    const globalPinSidePreference = globalSettingsState?.pinning.pinSide;
    const globalUnpinConflictResolutionPreference =
      globalSettingsState?.pinning.unpinConflictResolution;

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
