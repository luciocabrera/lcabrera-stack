import type { RunScanRow } from '@repo/scan-ingestion/queries/getRunScans.util';

import { StatusBadge, TableLayout } from '@lcabrera/ui';
import { createEmptyColumnsState } from '@lcabrera/ui/components/Table/utils/createEmptyColumnsState.util';
import { useLoaderData } from 'react-router';

import { useRunStatusSocket } from '@/hooks/useRunStatusSocket.hook';

import type { loader } from './runDetail.loader';

import { resolveRunStatusTone } from '../utils/resolveRunStatusTone.util';
import { RUN_SCANS_COLUMNS } from './RunDetail.constants';

export const RunDetail = () => {
  const { run, scansPromise } = useLoaderData<typeof loader>();
  useRunStatusSocket({ runId: run.id });

  return (
    <div>
      <h1>
        Run{' '}
        <StatusBadge
          label={run.status}
          tone={resolveRunStatusTone(run.status)}
        />
      </h1>
      <p>Origin: {run.origin}</p>
      {Boolean(run.git_branch) && <p>Branch: {run.git_branch}</p>}

      <h2>Scans</h2>
      <TableLayout<RunScanRow, readonly RunScanRow[]>
        columnsState={createEmptyColumnsState({ columns: RUN_SCANS_COLUMNS })}
        dataPromise={scansPromise}
        dataSelector={(rows) => rows}
        metaState={{ title: { plural: 'Scans', singular: 'Scan' } }}
      />
    </div>
  );
};
