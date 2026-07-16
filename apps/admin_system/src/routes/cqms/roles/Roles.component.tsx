import type { RoleListViewRow } from '@repo/scan-ingestion/queries/getRoleListView.util';

import { TableLayout } from '@repo/ui/components/Table/TableLayout';
import { createEmptyColumnsState } from '@repo/ui/components/Table/utils/createEmptyColumnsState.util';
import { useLoaderData } from 'react-router';

import type { loader } from './roles.loader';

import { ROLE_LIST_COLUMNS } from './Roles.constants';

const TITLE = {
  plural: 'Roles',
  singular: 'Role',
};

/**
 * Role management list (ADR-024) — crud metadata navigation keyed by
 * role_name (the scanners-list convention). No delete: roles soft-retire
 * via enabled, and the seeded admin role is immutable in Postgres.
 */
export const Roles = () => {
  const { rolesPromise } = useLoaderData<typeof loader>();

  return (
    <TableLayout<RoleListViewRow, readonly RoleListViewRow[]>
      columnsState={createEmptyColumnsState({ columns: ROLE_LIST_COLUMNS })}
      dataPromise={rolesPromise}
      dataSelector={(rows) => rows}
      metaState={{
        crud: { create: true, read: true, update: true },
        title: TITLE,
      }}
    />
  );
};
