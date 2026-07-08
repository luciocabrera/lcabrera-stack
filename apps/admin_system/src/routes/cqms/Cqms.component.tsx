import type { ProjectListViewRow } from '@repo/scan-ingestion/queries/getProjectListView.util';

import { TableLayout } from '@repo/ui/components/Table/TableLayout';
import { createEmptyColumnsState } from '@repo/ui/components/Table/utils/createEmptyColumnsState.util';
import { useLoaderData } from 'react-router';

import type { loader } from './cqms.loader';

import { PROJECT_LIST_COLUMNS } from './Cqms.constants';

const TITLE = {
  plural: 'Projects',
  singular: 'Project',
};

/**
 * Project list — crud metadata convention (see scanners/users/roles).
 * Navigation comes entirely from the Table's crud metadata: `create` renders
 * the header "new" link, `read`/`update` render per-row view/edit actions
 * targeting `view/<id>` / `edit/<id>` relative to this route (the id column
 * is the primary key). No delete — no delete function exists for projects.
 */
export const Cqms = () => {
  const { projectsPromise } = useLoaderData<typeof loader>();

  return (
    <TableLayout<ProjectListViewRow, readonly ProjectListViewRow[]>
      columnsState={createEmptyColumnsState({
        columns: PROJECT_LIST_COLUMNS,
      })}
      dataPromise={projectsPromise}
      dataSelector={(rows) => rows}
      metaState={{
        crud: { create: true, read: true, update: true },
        title: TITLE,
      }}
    />
  );
};
