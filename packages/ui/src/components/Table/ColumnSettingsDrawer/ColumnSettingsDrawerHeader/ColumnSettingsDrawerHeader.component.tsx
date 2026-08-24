import { SettingsIcon } from '#ui/components/Icons';
import {
  SidePanelHeader,
  SidePanelHeaderToolbar,
  SidePanelTitle,
} from '#ui/components/SidePanel';
import { useGetNormalizedColumn } from '#ui/components/Table/contexts/TableConfig/columns/selectors';
import { useSetTableIsColumnSettingsPinned } from '#ui/components/Table/contexts/TableConfig/meta/actions';
import {
  useGetTableColumnSelectedKey,
  useGetTableIsColumnSettingsPinned,
} from '#ui/components/Table/contexts/TableConfig/meta/selectors';
import { ICON_SIZE_LG } from '#ui/design-system/constants';

import {
  useGetTableIsLoading,
  useGetTableIsLoadingMore,
} from '../../contexts/TableData/data/selectors';
import { useCancelColumnSettings } from '../hooks/useCancelColumnSettings.hook';

export const ColumnSettingsDrawerHeader = <
  TData extends Record<string, unknown>,
>() => {
  const isLoading = useGetTableIsLoading();
  const isLoadingMore = useGetTableIsLoadingMore();
  const isPinned = useGetTableIsColumnSettingsPinned();
  const columnKey = useGetTableColumnSelectedKey<TData>();
  const isBusy = isLoading || isLoadingMore;
  const cancelColumnSettings = useCancelColumnSettings({ isBusy });
  const column = useGetNormalizedColumn<TData>(columnKey);

  const setIsPinned = useSetTableIsColumnSettingsPinned();

  const handleTogglePin = () => {
    if (isBusy) {
      return;
    }

    setIsPinned(!isPinned);
  };

  return (
    <SidePanelHeader
      actions={
        <SidePanelHeaderToolbar
          isBusy={isBusy}
          isPinned={isPinned}
          onClose={cancelColumnSettings}
          onTogglePin={handleTogglePin}
        />
      }
    >
      <SidePanelTitle icon={<SettingsIcon size={ICON_SIZE_LG} />}>
        {column.label}
      </SidePanelTitle>
    </SidePanelHeader>
  );
};
