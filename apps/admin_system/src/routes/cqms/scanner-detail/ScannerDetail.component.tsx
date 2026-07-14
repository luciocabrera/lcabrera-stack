import type { ScannerVersionRow } from '@repo/scan-ingestion/queries/getScannerVersions.util';

import { NavLink, SectionCard, StatusBadge, TableLayout } from '@repo/ui';
import { createEmptyColumnsState } from '@repo/ui/components/Table/utils/createEmptyColumnsState.util';
import { useLoaderData } from 'react-router';

import type { loader } from './scannerDetail.loader';

import { SCANNER_VERSION_COLUMNS } from './ScannerDetail.constants';

export const ScannerDetail = () => {
  const { scanner, versionsPromise } = useLoaderData<typeof loader>();

  return (
    <div>
      <h1>{scanner.display_name}</h1>
      <p>
        <StatusBadge
          label={scanner.is_active ? 'active' : 'inactive'}
          tone={scanner.is_active ? 'success' : 'neutral'}
        />{' '}
        {scanner.deterministic ? 'Deterministic' : 'LLM agent'} · v
        {scanner.version} · {scanner.skill_path}
      </p>
      <NavLink color='primary' to={`/cqms/scanners/edit/${scanner.scanner_id}`}>
        Edit Scanner
      </NavLink>

      <SectionCard title='Registry'>
        <p>{scanner.description ?? 'No description.'}</p>
        <p>
          Command template: {scanner.command_template ?? '—'}
          <br />
          Raw artifact: {scanner.raw_artifact_file_name ?? '—'}
          <br />
          Supports diff scope: {scanner.supports_diff_scope ? 'yes' : 'no'}
          <br />
          Allowed tools: {(scanner.allowed_tools ?? []).join(', ') || '—'}
        </p>
      </SectionCard>

      <h2>Version History</h2>
      <TableLayout<ScannerVersionRow, readonly ScannerVersionRow[]>
        columnsState={createEmptyColumnsState({
          columns: SCANNER_VERSION_COLUMNS,
        })}
        dataPromise={versionsPromise}
        dataSelector={(rows) => rows}
        metaState={{ title: { plural: 'Versions', singular: 'Version' } }}
      />
    </div>
  );
};
