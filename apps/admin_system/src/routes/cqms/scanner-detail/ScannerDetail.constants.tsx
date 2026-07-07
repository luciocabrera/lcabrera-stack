import type { ScannerVersionRow } from '@repo/scan-ingestion/queries/getScannerVersions.util';
import type { TableColumn } from '@repo/ui/components/Table';

const readSnapshotSummary = (snapshot: Record<string, unknown>): string => {
  const displayName = snapshot['display_name'];
  const description = snapshot['description'];
  const namePart = typeof displayName === 'string' ? displayName : '—';
  return typeof description === 'string'
    ? `${namePart} — ${description}`
    : namePart;
};

export const SCANNER_VERSION_COLUMNS: readonly TableColumn<ScannerVersionRow>[] =
  [
    { dataType: 'number', key: 'version', label: 'Version', minWidth: 90 },
    {
      key: 'snapshot',
      label: 'Snapshot',
      minWidth: 420,
      render: (row) => readSnapshotSummary(row.snapshot),
    },
    { dataType: 'date', key: 'created_at', label: 'Saved', minWidth: 150 },
  ];
