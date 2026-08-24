import { ActionButtons } from '#ui/components/ActionButtons';
import { SidePanelFooter } from '#ui/components/SidePanel';

import {
  useGetTableIsLoading,
  useGetTableIsLoadingMore,
} from '../../contexts/TableData/data/selectors';
import { useBatchSetColumnDrawerSettings } from '../ColumnDrawerContext/actions';
import { useCancelColumnSettings } from '../hooks/useCancelColumnSettings.hook';

export const ColumnSettingsDrawerFooter = () => {
  const isLoading = useGetTableIsLoading();
  const isLoadingMore = useGetTableIsLoadingMore();

  const isBusy = isLoading || isLoadingMore;
  const batchSetColumnDrawerSettings = useBatchSetColumnDrawerSettings();
  const cancelColumnSettings = useCancelColumnSettings({ isBusy });

  const handleAccept = () => {
    if (isBusy) {
      return;
    }

    batchSetColumnDrawerSettings();
  };

  return (
    <SidePanelFooter>
      <ActionButtons
        actions={[
          { label: 'Accept', onClick: handleAccept, variant: 'primary' },
          {
            label: 'Cancel',
            onClick: cancelColumnSettings,
          },
        ]}
        isBusy={isBusy}
      />
    </SidePanelFooter>
  );
};
