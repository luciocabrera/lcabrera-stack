import { triggerScan as triggerScanMutation } from '@repo/scan-ingestion/queries/triggerScan.util';
import { type ActionFunctionArgs, data, redirect } from 'react-router';
import { z } from 'zod';

import { triggerScanSchema } from './triggerScan.schema';

const paramsSchema = z.object({ projectId: z.string().uuid() });

export const action = async ({ params, request }: ActionFunctionArgs) => {
  const parsedParams = paramsSchema.safeParse(params);
  if (!parsedParams.success) {
    throw data('Invalid project id.', { status: 400 });
  }

  const formData = await request.formData();
  const parsed = triggerScanSchema.safeParse({
    scannerIds: formData.getAll('scannerIds'),
  });

  if (!parsed.success) {
    return {
      errors: {
        scannerIds: parsed.error.flatten().fieldErrors.scannerIds?.[0],
      },
    };
  }

  const { runId } = await triggerScanMutation({
    projectId: parsedParams.data.projectId,
    scannerIds: parsed.data.scannerIds,
    scopeValue: '.',
  });

  return redirect(
    `/cqms/projects/view/${parsedParams.data.projectId}/runs/${runId}`,
  );
};
