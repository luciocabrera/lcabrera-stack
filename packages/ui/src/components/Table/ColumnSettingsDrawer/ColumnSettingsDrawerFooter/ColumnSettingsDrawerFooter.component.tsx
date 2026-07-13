import { Button } from '@repo/ui/components/Button';
import { SidePanelFooter } from '@repo/ui/components/SidePanel';

import {
  useGetTableIsLoading,
  useGetTableIsLoadingMore,
} from '../../contexts/TableData/data/selectors';
import { useBatchSetColumnDrawerSettings } from '../ColumnDrawerContext/actions';
import { useCancelColumnSettings } from '../hooks/useCancelColumnSettings.hook';

/**
 * Footer of the column settings drawer: the Accept and Cancel buttons.
 * Accept commits all drawer-local column state to the table and keeps the
 * drawer open; Cancel discards pending changes and closes unless pinned.
 * Both no-op while busy.
 */
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
      <Button color='primary' isBusy={isBusy} onClick={handleAccept} size='sm'>
        Accept
      </Button>
      <Button
        color='outline'
        isBusy={isBusy}
        onClick={cancelColumnSettings}
        size='sm'
      >
        Cancel
      </Button>
    </SidePanelFooter>
  );
};
