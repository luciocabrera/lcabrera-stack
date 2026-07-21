import type { ProjectRunRow } from '@repo/scan-ingestion/queries/getProjectRuns.util';

import { NavLink, StatusBadge, TableLayout } from '@lcabrera/ui';
import { createEmptyColumnsState } from '@lcabrera/ui/components/Table/utils/createEmptyColumnsState.util';
import { Suspense } from 'react';
import { useLoaderData } from 'react-router';

import type { loader } from './projectDetail.loader';
import type { RenderTriggerAffordanceArgs } from './ProjectDetail.types';

import { resolveRunStatusTone } from '../utils/resolveRunStatusTone.util';
import { PROJECT_RUNS_COLUMNS } from './ProjectDetail.constants';
import { ProjectGrantsPanel } from './ProjectGrantsPanel/ProjectGrantsPanel.component';
import { ProjectSyncPanel } from './ProjectSyncPanel/ProjectSyncPanel.component';
import { ProjectTrendPanel } from './ProjectTrendPanel';

// Three-state affordance: an active run wins (0021's guard), then the
// snapshot precondition (ADR-028 — the DB rejects snapshot-less triggers,
// this just stops the dead-end navigation), then the live link.
const renderTriggerAffordance = ({
  hasActiveRun,
  project,
}: RenderTriggerAffordanceArgs) => {
  if (hasActiveRun) {
    return (
      <span>
        <StatusBadge label='running' tone={resolveRunStatusTone('running')} /> A
        scan is already running for this project.
      </span>
    );
  }
  if (!project.latest_snapshot_id) {
    return <p>Upload a code snapshot below to enable scans.</p>;
  }
  return (
    <NavLink
      to={`/cqms/projects/view/${project.id}/trigger-scan`}
      variant='primary'
    >
      Trigger Scan
    </NavLink>
  );
};

export const ProjectDetail = () => {
  const {
    canManageGrants,
    grantsPromise,
    hasActiveRun,
    project,
    runsPromise,
    trendPromise,
    usersPromise,
  } = useLoaderData<typeof loader>();

  return (
    <div>
      <h1>{project.name}</h1>
      {renderTriggerAffordance({ hasActiveRun, project })}
      <NavLink to={`/cqms/projects/edit/${project.id}`} variant='ghost'>
        Edit Project
      </NavLink>

      <h2>Code Snapshot</h2>
      <ProjectSyncPanel project={project} />

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

      {Boolean(canManageGrants) && (
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
