import { useResetTableSettings } from '../TableDrawerContext/actions';
import { useCloseTableSettingsIfUnpinned } from './useCloseTableSettingsIfUnpinned.hook';

type UseCancelTableSettingsArgs = {
  readonly isBusy: boolean;
};

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
