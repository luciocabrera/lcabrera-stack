import type { ScannerListViewRow } from '@repo/scan-ingestion/queries/getScannerListView.util';

import { TableLayout } from '@lcabrera/ui/components/Table/TableLayout';
import { createEmptyColumnsState } from '@lcabrera/ui/components/Table/utils/createEmptyColumnsState.util';
import { useLoaderData } from 'react-router';

import type { loader } from './scanners.loader';

import { SCANNER_LIST_COLUMNS } from './Scanners.constants';

const TITLE = {
  plural: 'Scanners',
  singular: 'Scanner',
};

/**
 * Registry list (ADR-023). Navigation comes entirely from the Table's crud
 * metadata: `create` renders the header "new" link, `read`/`update` render
 * per-row view/edit actions targeting `view/<scanner_id>` /
 * `edit/<scanner_id>` relative to this route (the scanner_id column is the
 * primary key). No delete — scanners soft-retire via is_active/enabled.
 */
export const Scanners = () => {
  const { scannersPromise } = useLoaderData<typeof loader>();

  return (
    <TableLayout<ScannerListViewRow, readonly ScannerListViewRow[]>
      columnsState={createEmptyColumnsState({
        columns: SCANNER_LIST_COLUMNS,
      })}
      dataPromise={scannersPromise}
      dataSelector={(rows) => rows}
      metaState={{
        crud: { create: true, read: true, update: true },
        title: TITLE,
      }}
    />
  );
};
