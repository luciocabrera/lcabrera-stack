import type { DataKey } from '@/components/Table/Table.types';

import { useGetGlobalPinSidePreference } from '@/contexts/GlobalSettingsContext/selectors/useGetGlobalPinSidePreference.hook';
import { useGetGlobalUnpinConflictResolutionPreference } from '@/contexts/GlobalSettingsContext/selectors/useGetGlobalUnpinConflictResolutionPreference.hook';
import { useTableConfigContextValue } from '@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { useTableDrawerContextValue } from '@/components/Table/TableSettingsDrawer/TableDrawerContext/useTableDrawerContextValue.hook';

import { useAcceptPinSide } from './useAcceptPinSide.hook';
import { useAcceptUnpinConflict } from './useAcceptUnpinConflict.hook';
import { resolveToggleColumnPinUpdate } from './utils/resolveToggleColumnPinUpdate.util';
import { useColumnOrderSectionContextValue } from '../useColumnOrderSectionContextValue.hook';

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

    if (resolution.kind === 'ignored-static') {
      return;
    }

    if (resolution.kind === 'apply-pinning-direct') {
      drawerColumnsStore.set({ columnPinning: resolution.nextPinning });
      return;
    }

    if (resolution.kind === 'open-pin-side-modal') {
      modalsStore.set({ pinSideModal: resolution.modal });
      return;
    }

    if (resolution.kind === 'auto-accept-pin-side') {
      modalsStore.set({ pinSideModal: resolution.modal });
      acceptPinSide(resolution.pinSide);
      return;
    }

    if (resolution.kind === 'open-unpin-conflict-modal') {
      modalsStore.set({ unpinConflictModal: resolution.modal });
      return;
    }

    modalsStore.set({ unpinConflictModal: resolution.modal });
    acceptUnpinConflict(resolution.resolution);
  };
};
