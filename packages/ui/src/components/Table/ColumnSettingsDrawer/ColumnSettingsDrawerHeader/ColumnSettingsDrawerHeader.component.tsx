import { SettingsIcon } from '@repo/ui/components/Icons';
import {
  SidePanelHeader,
  SidePanelHeaderToolbar,
  SidePanelTitle,
} from '@repo/ui/components/SidePanel';
import { useGetNormalizedColumn } from '@repo/ui/components/Table/contexts/TableConfig/columns/selectors';
import { useSetTableIsColumnSettingsPinned } from '@repo/ui/components/Table/contexts/TableConfig/meta/actions';
import {
  useGetTableColumnSelectedKey,
  useGetTableIsColumnSettingsPinned,
} from '@repo/ui/components/Table/contexts/TableConfig/meta/selectors';
import { ICON_SIZE_LG } from '@repo/ui/design-system/constants';

import {
  useGetTableIsLoading,
  useGetTableIsLoadingMore,
} from '../../contexts/TableData/data/selectors';
import { useCancelColumnSettings } from '../hooks/useCancelColumnSettings.hook';

/**
 * Header of the column settings drawer: settings icon + column label plus
 * the pin/close toolbar. Toggling the pin writes to the table meta store and
 * closing cancels pending drawer changes; both no-op while busy.
 */
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
