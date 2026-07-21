import type { TableColumn } from '@lcabrera/ui/components/Table';
import type { RunScanRow } from '@repo/scan-ingestion/queries/getRunScans.util';

import { StatusBadge } from '@lcabrera/ui/components/StatusBadge';

import { resolveRunStatusTone } from '../utils/resolveRunStatusTone.util';
import { ScanLink } from './ScanLink';

export const RUN_SCANS_COLUMNS: readonly TableColumn<RunScanRow>[] = [
  {
    key: 'scanner_id',
    label: 'Scanner',
    minWidth: 150,
    render: (row) => <ScanLink scan={row} />,
  },
  {
    key: 'status',
    label: 'Status',
    minWidth: 130,
    render: (row) => (
      <StatusBadge label={row.status} tone={resolveRunStatusTone(row.status)} />
    ),
  },
  {
    dataType: 'number',
    key: 'blocker_count',
    label: 'Blocker',
    minWidth: 90,
  },
  { dataType: 'number', key: 'high_count', label: 'High', minWidth: 90 },
  {
    dataType: 'number',
    key: 'medium_count',
    label: 'Medium',
    minWidth: 100,
  },
  { dataType: 'number', key: 'low_count', label: 'Low', minWidth: 90 },
  { dataType: 'number', key: 'nit_count', label: 'Nit', minWidth: 90 },
  {
    dataType: 'number',
    key: 'duration_ms',
    label: 'Duration (ms)',
    minWidth: 140,
  },
];
