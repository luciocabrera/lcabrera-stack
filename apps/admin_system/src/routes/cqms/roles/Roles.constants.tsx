import type { TableColumn } from '@lcabrera/ui/components/Table';
import type { RoleListViewRow } from '@repo/scan-ingestion/queries/getRoleListView.util';

import { StatusBadge } from '@lcabrera/ui/components/StatusBadge';

export const ROLE_LIST_COLUMNS: readonly TableColumn<RoleListViewRow>[] = [
  {
    dataType: 'string',
    isPrimaryKey: true,
    key: 'role_name',
    label: 'Role',
    minWidth: 140,
  },
  {
    dataType: 'string',
    key: 'description',
    label: 'Description',
    minWidth: 320,
  },
  {
    dataType: 'number',
    key: 'permission_count',
    label: 'Permissions',
    minWidth: 120,
  },
  { dataType: 'number', key: 'user_count', label: 'Users', minWidth: 90 },
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
];
