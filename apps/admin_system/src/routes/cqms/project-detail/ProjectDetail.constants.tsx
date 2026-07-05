import type { ProjectRunRow } from '@repo/scan-ingestion/queries/getProjectRuns.util';
import type { TableColumn } from '@repo/ui/components/Table';

import { StatusBadge } from '@repo/ui/components/StatusBadge';

import { resolveRunStatusTone } from '../utils/resolveRunStatusTone.util';
import { RunLink } from './RunLink';

export const PROJECT_RUNS_COLUMNS: readonly TableColumn<ProjectRunRow>[] = [
  {
    key: 'created_at',
    label: 'Started',
    minWidth: 170,
    render: (row) => <RunLink run={row} />,
  },
  {
    key: 'status',
    label: 'Status',
    minWidth: 130,
    render: (row) => (
      <StatusBadge label={row.status} tone={resolveRunStatusTone(row.status)} />
    ),
  },
  { dataType: 'string', key: 'origin', label: 'Origin', minWidth: 120 },
  { dataType: 'string', key: 'git_branch', label: 'Branch', minWidth: 120 },
  { dataType: 'number', key: 'total_high', label: 'High', minWidth: 90 },
  {
    dataType: 'number',
    key: 'total_medium',
    label: 'Medium',
    minWidth: 100,
  },
];
