import { Button } from '@repo/ui/components/Button';
import { SettingsIcon } from '@repo/ui/components/Icons';

import type { TableTitleActionsProps } from './TableTitleActions.types';

import { useToogleTableIsTableSettingsOpen } from '../../contexts/TableConfig/meta/actions';
import {
  useGetTableCrud,
  useGetTableTitleSingular,
} from '../../contexts/TableConfig/meta/selectors';
import {
  useGetTableIsLoading,
  useGetTableIsLoadingMore,
} from '../../contexts/TableData/data/selectors';
import { TableCreateLink } from '../../TableCreateLink';

/**
 * Action cluster of the table title bar: consumer-provided actions, the
 * create link (when CRUD create is enabled), and the settings-drawer toggle.
 * Owns its store wiring: reads crud/title/loading state and dispatches the
 * settings toggle itself. The action buttons show the busy shimmer for both
 * the initial load and the infinite-scroll "load more" fetch.
 */
export const TableTitleActions = ({ actions }: TableTitleActionsProps) => {
  const crud = useGetTableCrud();
  const isLoading = useGetTableIsLoading();
  const isLoadingMore = useGetTableIsLoadingMore();
  const titleSingular = useGetTableTitleSingular();
  const toggleTableIsTableSettingsOpen = useToogleTableIsTableSettingsOpen();

  const isBusy = isLoading || isLoadingMore;
  const resolvedTitleSingular = titleSingular ?? 'Record';

  return (
    <>
      {actions}
      {crud?.create && (
        <TableCreateLink
          isBusy={isBusy}
          title={resolvedTitleSingular}
          to='new'
        />
      )}
      <Button
        aria-label='Table settings'
        icon={<SettingsIcon size={16} />}
        isBusy={isBusy}
        onClick={toggleTableIsTableSettingsOpen}
        size='mini'
        variant='ghost'
      />
    </>
  );
};
