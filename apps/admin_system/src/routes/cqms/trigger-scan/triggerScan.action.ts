import { discoverProjectWorkspaces } from '@repo/scan-ingestion/ingestion/workspaces/discoverProjectWorkspaces.util';
import { getProjectById } from '@repo/scan-ingestion/queries/getProjectById.util';
import { replaceProjectWorkspaces } from '@repo/scan-ingestion/queries/replaceProjectWorkspaces.util';
import { triggerScan as triggerScanMutation } from '@repo/scan-ingestion/queries/triggerScan.util';
import { type ActionFunctionArgs, data, redirect } from 'react-router';
import { z } from 'zod';

import { requireUser } from '@/auth/requireUser.util';

import { isCheckboxChecked } from '../utils/isCheckboxChecked.util';
import { parseRouteParams } from '../utils/parseRouteParams.util';
import { computeFanOutCount } from './computeFanOutCount.util';
import { FAN_OUT_CONFIRMATION_THRESHOLD } from './triggerScan.constants';
import { triggerScanSchema } from './triggerScan.schema';

const paramsSchema = z.object({ projectId: z.string().uuid() });

export const action = async ({ params, request }: ActionFunctionArgs) => {
  // Actions run BEFORE loaders, so the layout loader's gate does not
  // cover POSTs — every cqms action authenticates itself (ADR-017).
  const user = await requireUser({ request });

  const { projectId } = parseRouteParams({
    invalidMessage: 'Invalid project id.',
    params,
    schema: paramsSchema,
  });

  const formData = await request.formData();
  const parsed = triggerScanSchema.safeParse({
    confirmFanOut: isCheckboxChecked({ formData, name: 'confirmFanOut' }),
    scannerIds: formData.getAll('scannerIds'),
    workspacePaths: formData.getAll('workspacePaths'),
  });

  if (!parsed.success) {
    return {
      errors: {
        scannerIds: parsed.error.flatten().fieldErrors.scannerIds?.[0],
      },
    };
  }

  // Selected workspaces are validated against a FRESH discovery — the
  // form's options could be stale (a new snapshot synced since the page
  // loaded), and form values are attacker-controllable anyway (ADR-021).
  const project = await getProjectById({
    projectId: projectId,
  });
  if (!project) {
    throw data('Project not found.', { status: 404 });
  }
  if (!project.snapshot_path) {
    // fn_create_run_with_scoped_scans rejects this too (0027) — failing
    // here first gives the precise message instead of a generic DB error.
    return {
      errors: {
        scannerIds:
          'No code snapshot has been synced for this project. Upload a snapshot before triggering a scan.',
      },
    };
  }
  const discovered = discoverProjectWorkspaces({
    rootPath: project.snapshot_path,
  });
  const discoveredPaths = new Set(
    discovered.map((workspace) => workspace.workspace_path),
  );
  const unknownSelection = parsed.data.workspacePaths.find(
    (workspacePath) => !discoveredPaths.has(workspacePath),
  );
  if (unknownSelection !== undefined) {
    return {
      errors: {
        workspacePaths: `Not a workspace of this project: ${unknownSelection}`,
      },
    };
  }

  // The actual multiplier behind the cost incident this guards against:
  // scanners × workspaces fan out into that many queued scans from one
  // submission. Past the threshold, require an explicit confirmation
  // rather than silently queuing a large batch.
  const fanOutCount = computeFanOutCount({
    scannerCount: parsed.data.scannerIds.length,
    workspaceCount: parsed.data.workspacePaths.length,
  });
  if (
    fanOutCount > FAN_OUT_CONFIRMATION_THRESHOLD &&
    !parsed.data.confirmFanOut
  ) {
    return {
      errors: {
        confirmFanOut: `This will queue ${fanOutCount} scans. Check the box below to confirm and start the scan.`,
      },
    };
  }

  // Best-effort snapshot refresh — discovery already happened for
  // validation, so persist it; a failure here must not block the scan.
  try {
    await replaceProjectWorkspaces({
      projectId: project.id,
      userId: user.id,
      workspaces: discovered,
    });
  } catch (error) {
    console.warn('Workspace snapshot refresh failed (non-fatal):', error);
  }

  try {
    const { runId } = await triggerScanMutation({
      projectId: projectId,
      scannerIds: parsed.data.scannerIds,
      triggeredBy: user.username,
      userId: user.id,
      workspacePaths: parsed.data.workspacePaths,
    });

    return redirect(`/cqms/projects/view/${projectId}/runs/${runId}`);
  } catch (error) {
    // fn_create_run's typed rejection (e.g. a viewer without the
    // execute/scan grant, ADR-024) renders as a field error, not a 500.
    return {
      errors: {
        scannerIds:
          error instanceof Error ? error.message : 'Failed to start the scan.',
      },
    };
  }
};
