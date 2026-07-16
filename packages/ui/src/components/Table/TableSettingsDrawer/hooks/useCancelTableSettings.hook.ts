import { useResetTableSettings } from '../TableDrawerContext/actions';
import { useCloseTableSettingsIfUnpinned } from './useCloseTableSettingsIfUnpinned.hook';

/** Args for the {@link useCancelTableSettings} hook. */
type UseCancelTableSettingsArgs = {
  readonly isBusy: boolean;
};

/**
 * Returns the drawer cancel handler: discards drawer-local changes by
 * resetting them from the table state, then closes the drawer unless it is
 * pinned. No-ops while the table is busy. Shared by the side panel close,
 * the header toolbar close, and the footer Cancel button.
 */
export const useCancelTableSettings = ({
  isBusy,
}: UseCancelTableSettingsArgs) => {
  const closeTableSettingsIfUnpinned = useCloseTableSettingsIfUnpinned();
  const resetTableDrawerSettings = useResetTableSettings();

  return () => {
    if (isBusy) {
      return;
    }

    resetTableDrawerSettings();
    closeTableSettingsIfUnpinned();
  };
};
