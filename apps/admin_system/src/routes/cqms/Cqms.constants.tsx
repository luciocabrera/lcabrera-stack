import type { ProjectListViewRow } from '@repo/scan-ingestion/queries/getProjectListView.util';
import type { TableColumn } from '@repo/ui/components/Table';

import { StatusBadge } from '@repo/ui/components/StatusBadge';
import { Link } from 'react-router';

import { resolveRunStatusTone } from './utils/resolveRunStatusTone.util';

export const PROJECT_LIST_COLUMNS: readonly TableColumn<ProjectListViewRow>[] =
  [
    {
      key: 'name',
      label: 'Project',
      minWidth: 160,
      render: (row) => (
        <Link to={`/cqms/projects/view/${row.id}`}>{row.name}</Link>
      ),
    },
    { dataType: 'string', key: 'local_path', label: 'Path', minWidth: 220 },
    {
      key: 'latest_run_status',
      label: 'Latest Run',
      minWidth: 130,
      render: (row) =>
        row.latest_run_status ? (
          <StatusBadge
            label={row.latest_run_status}
            tone={resolveRunStatusTone(row.latest_run_status)}
          />
        ) : (
          '—'
        ),
    },
    { dataType: 'number', key: 'total_high', label: 'High', minWidth: 90 },
    {
      dataType: 'number',
      key: 'total_medium',
      label: 'Medium',
      minWidth: 100,
    },
    {
      dataType: 'date',
      key: 'last_scanned_at',
      label: 'Last Scanned',
      minWidth: 150,
    },
    {
      key: 'id',
      label: '',
      minWidth: 70,
      render: (row) => <Link to={`/cqms/projects/edit/${row.id}`}>Edit</Link>,
    },
  ];
