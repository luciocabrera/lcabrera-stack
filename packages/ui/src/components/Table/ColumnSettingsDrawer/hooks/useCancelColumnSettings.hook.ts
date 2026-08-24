import { useGetTableIsColumnSettingsPinned } from '#ui/components/Table/contexts/TableConfig/meta/selectors';

import { useResetAllColumnDrawerSettings } from '../ColumnDrawerContext/actions';

type UseCancelColumnSettingsArgs = {
  readonly isBusy: boolean;
};

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
