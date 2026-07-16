import type { ScanFindingsResult } from '@repo/scan-ingestion/queries/getScanFindings.util';

import { JsonExplorer, StatusBadge, TableLayout, Tabs } from '@repo/ui';
import { createEmptyColumnsState } from '@repo/ui/components/Table/utils/createEmptyColumnsState.util';
import { Suspense } from 'react';
import { useLoaderData } from 'react-router';

import type { loader } from './scanDetail.loader';

import { resolveRunStatusTone } from '../utils/resolveRunStatusTone.util';
import { SCAN_FINDINGS_COLUMNS } from './ScanDetail.constants';
import { ScanReportPanel } from './ScanReportPanel';

export const ScanDetail = () => {
  const { findingsPromise, jsonSections, reportPromise, scan } =
    useLoaderData<typeof loader>();

  return (
    <div>
      <h1>
        {scan.scanner_id}{' '}
        <StatusBadge
          label={scan.status}
          tone={resolveRunStatusTone(scan.status)}
        />
      </h1>
      {scan.error_message && <p>{scan.error_message}</p>}

      <Tabs
        tabs={[
          {
            children: (
              <Suspense fallback={<p>Loading report…</p>}>
                <ScanReportPanel reportPromise={reportPromise} />
              </Suspense>
            ),
            header: 'Report',
            key: 'report',
          },
          {
            children: (
              <TableLayout<
                ScanFindingsResult['rows'][number],
                ScanFindingsResult
              >
                columnsState={createEmptyColumnsState({
                  columns: SCAN_FINDINGS_COLUMNS,
                })}
                dataPromise={findingsPromise}
                dataSelector={(response) => response.rows}
                dataTotalSelector={(response) => response.total}
                metaState={{
                  title: { plural: 'Findings', singular: 'Finding' },
                }}
              />
            ),
            header: 'Findings',
            key: 'findings',
          },
          {
            children:
              jsonSections.length > 0 ? (
                <JsonExplorer sections={jsonSections} />
              ) : (
                <p>No raw JSON captured for this scan.</p>
              ),
            header: 'Raw JSON',
            key: 'raw-json',
          },
        ]}
      />
    </div>
  );
};
