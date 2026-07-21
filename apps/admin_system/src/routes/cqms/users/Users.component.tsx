import type { UserListViewRow } from '@repo/scan-ingestion/queries/getUserListView.util';

import { TableLayout } from '@lcabrera/ui';
import { createEmptyColumnsState } from '@lcabrera/ui/components/Table/utils/createEmptyColumnsState.util';
import { useLoaderData } from 'react-router';

import type { loader } from './users.loader';

import { USER_LIST_COLUMNS } from './Users.constants';

const TITLE = {
  plural: 'Users',
  singular: 'User',
};

/**
 * User management list (ADR-024). Navigation comes from the Table's crud
 * metadata (the scanners-list convention): username is the primary-key
 * column, so view/edit rows link to `view/<username>` / `edit/<username>`.
 * No delete — users soft-retire via enabled.
 */
export const Users = () => {
  const { usersPromise } = useLoaderData<typeof loader>();

  return (
    <TableLayout<UserListViewRow, readonly UserListViewRow[]>
      columnsState={createEmptyColumnsState({ columns: USER_LIST_COLUMNS })}
      dataPromise={usersPromise}
      dataSelector={(rows) => rows}
      metaState={{
        crud: { create: true, read: true, update: true },
        title: TITLE,
      }}
    />
  );
};
