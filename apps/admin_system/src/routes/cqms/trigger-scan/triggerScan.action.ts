import { discoverProjectWorkspaces } from '@repo/scan-ingestion/ingestion/workspaces/discoverProjectWorkspaces.util';
import { getProjectById } from '@repo/scan-ingestion/queries/getProjectById.util';
import { replaceProjectWorkspaces } from '@repo/scan-ingestion/queries/replaceProjectWorkspaces.util';
import { triggerScan as triggerScanMutation } from '@repo/scan-ingestion/queries/triggerScan.util';
import { type ActionFunctionArgs, data, redirect } from 'react-router';
import { z } from 'zod';

import { requireUser } from '@/auth/requireUser.util';

import { isCheckboxChecked } from '../utils/isCheckboxChecked.util';
import { computeFanOutCount } from './computeFanOutCount.util';
import { FAN_OUT_CONFIRMATION_THRESHOLD } from './triggerScan.constants';
import { triggerScanSchema } from './triggerScan.schema';

const paramsSchema = z.object({ projectId: z.string().uuid() });

export const action = async ({ params, request }: ActionFunctionArgs) => {
  // Actions run BEFORE loaders, so the layout loader's gate does not
  // cover POSTs — every cqms action authenticates itself (ADR-017).
  const user = await requireUser({ request });

  const parsedParams = paramsSchema.safeParse(params);
  if (!parsedParams.success) {
    throw data('Invalid project id.', { status: 400 });
  }

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
  // form's options could be stale (workspace deleted since the page
  // loaded), and form values are attacker-controllable anyway (ADR-021).
  const project = await getProjectById({
    projectId: parsedParams.data.projectId,
  });
  if (!project) {
    throw data('Project not found.', { status: 404 });
  }
  const discovered = discoverProjectWorkspaces({
    rootPath: project.local_path,
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
      projectId: parsedParams.data.projectId,
      scannerIds: parsed.data.scannerIds,
      triggeredBy: user.username,
      userId: user.id,
      workspacePaths: parsed.data.workspacePaths,
    });

    return redirect(
      `/cqms/projects/view/${parsedParams.data.projectId}/runs/${runId}`,
    );
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
