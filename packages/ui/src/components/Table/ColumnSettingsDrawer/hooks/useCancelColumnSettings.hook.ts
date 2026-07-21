import { useGetTableIsColumnSettingsPinned } from '@lcabrera/ui/components/Table/contexts/TableConfig/meta/selectors';

import { useResetAllColumnDrawerSettings } from '../ColumnDrawerContext/actions';

/** Args for the {@link useCancelColumnSettings} hook. */
type UseCancelColumnSettingsArgs = {
  readonly isBusy: boolean;
};

/**
 * Returns the drawer cancel handler: discards drawer-local column changes by
 * resetting them from the table state, closing the drawer unless it is
 * pinned (via the reset action's should-close argument). No-ops while the
 * table is busy. Shared by the side panel close, the header toolbar close,
 * and the footer Cancel button.
 */
export const useCancelColumnSettings = ({
  isBusy,
}: UseCancelColumnSettingsArgs) => {
  const isPinned = useGetTableIsColumnSettingsPinned();
  const resetAllColumnDrawerSettings = useResetAllColumnDrawerSettings();

  return () => {
    if (isBusy) {
      return;
    }

    resetAllColumnDrawerSettings(!isPinned);
  };
};
