import { Button } from '#ui/components/Button';
import { SettingsIcon } from '#ui/components/Icons';

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
      {Boolean(crud?.create) && (
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
