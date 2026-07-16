import type { UserListViewRow } from '@repo/scan-ingestion/queries/getUserListView.util';
import type { TableColumn } from '@repo/ui/components/Table';

import { StatusBadge } from '@repo/ui/components/StatusBadge';

export const USER_LIST_COLUMNS: readonly TableColumn<UserListViewRow>[] = [
  {
    dataType: 'string',
    isPrimaryKey: true,
    key: 'username',
    label: 'Username',
    minWidth: 160,
  },
  {
    dataType: 'string',
    key: 'display_name',
    label: 'Display Name',
    minWidth: 200,
  },
  {
    key: 'role_names',
    label: 'Roles',
    minWidth: 200,
    render: (row) => row.role_names.join(', ') || '—',
  },
  {
    key: 'enabled',
    label: 'Enabled',
    minWidth: 110,
    render: (row) => (
      <StatusBadge
        label={row.enabled ? 'enabled' : 'disabled'}
        tone={row.enabled ? 'success' : 'neutral'}
      />
    ),
  },
  { dataType: 'date', key: 'created_at', label: 'Created', minWidth: 150 },
];
