import type { ProjectRunRow } from '@repo/scan-ingestion/queries/getProjectRuns.util';

import { NavLink } from '@repo/ui/components/NavLink';
import { TableLayout } from '@repo/ui/components/Table/TableLayout';
import { createEmptyColumnsState } from '@repo/ui/components/Table/utils/createEmptyColumnsState.util';
import { Suspense } from 'react';
import { useLoaderData } from 'react-router';

import type { loader } from './projectDetail.loader';

import { PROJECT_RUNS_COLUMNS } from './ProjectDetail.constants';
import { ProjectGrantsPanel } from './ProjectGrantsPanel/ProjectGrantsPanel.component';
import { ProjectTrendPanel } from './ProjectTrendPanel';

export const ProjectDetail = () => {
  const {
    canManageGrants,
    grantsPromise,
    project,
    runsPromise,
    trendPromise,
    usersPromise,
  } = useLoaderData<typeof loader>();

  return (
    <div>
      <h1>{project.name}</h1>
      <p>{project.local_path}</p>
      <NavLink
        color='primary'
        to={`/cqms/projects/view/${project.id}/trigger-scan`}
      >
        Trigger Scan
      </NavLink>
      <NavLink color='ghost' to={`/cqms/projects/edit/${project.id}`}>
        Edit Project
      </NavLink>

      <h2>Trend</h2>
      <Suspense fallback={<p>Loading trend…</p>}>
        <ProjectTrendPanel trendPromise={trendPromise} />
      </Suspense>

      <h2>Runs</h2>
      <TableLayout<ProjectRunRow, readonly ProjectRunRow[]>
        columnsState={createEmptyColumnsState({
          columns: PROJECT_RUNS_COLUMNS,
        })}
        dataPromise={runsPromise}
        dataSelector={(rows) => rows}
        metaState={{ title: { plural: 'Runs', singular: 'Run' } }}
      />

      {canManageGrants && (
        <>
          <h2>Access Grants</h2>
          <Suspense fallback={<p>Loading grants…</p>}>
            <ProjectGrantsPanel
              grantsPromise={grantsPromise}
              usersPromise={usersPromise}
            />
          </Suspense>
        </>
      )}
    </div>
  );
};
