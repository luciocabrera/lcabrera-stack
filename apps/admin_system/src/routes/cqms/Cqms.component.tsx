import type { ProjectListViewRow } from '@repo/scan-ingestion/queries/getProjectListView.util';

import { TableCreateLink } from '@repo/ui/components/Table/TableCreateLink';
import { TableLayout } from '@repo/ui/components/Table/TableLayout';
import { createEmptyColumnsState } from '@repo/ui/components/Table/utils/createEmptyColumnsState.util';
import { useLoaderData } from 'react-router';

import type { loader } from './cqms.loader';

import { PROJECT_LIST_COLUMNS } from './Cqms.constants';

const TITLE = 'Projects';

export const Cqms = () => {
  const { projectsPromise } = useLoaderData<typeof loader>();

  return (
    <TableLayout<ProjectListViewRow, readonly ProjectListViewRow[]>
      actions={<TableCreateLink title={TITLE} to='/cqms/projects/new' />}
      columnsState={createEmptyColumnsState({
        columns: PROJECT_LIST_COLUMNS,
      })}
      dataPromise={projectsPromise}
      dataSelector={(rows) => rows}
      metaState={{ title: TITLE }}
    />
  );
};
