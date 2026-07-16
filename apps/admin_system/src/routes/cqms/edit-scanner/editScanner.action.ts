import { getErrorMessage } from '@repo/data-access/errors/getErrorMessage.util';
import { createScannerDetailTable } from '@repo/scan-ingestion/queries/createScannerDetailTable.util';
import { updateScanner } from '@repo/scan-ingestion/queries/updateScanner.util';
import { writeScannerArtifacts } from '@repo/scan-ingestion/registry/writeScannerArtifacts.util';
import { type ActionFunctionArgs, redirect } from 'react-router';
import { z } from 'zod';

import { requireUser } from '@/auth/requireUser.util';

import { parseRouteParams } from '../utils/parseRouteParams.util';
import { toScannerArtifactInput } from '../utils/toScannerArtifactInput.util';
import { toScannerWriteInput } from '../utils/toScannerWriteInput.util';
import { editScannerSchema } from './editScanner.schema';
import { readEditScannerFormValues } from './readEditScannerFormValues.util';
import { toEditScannerFieldErrors } from './toEditScannerFieldErrors.util';

const paramsSchema = z.object({
  scannerId: z.string().regex(/^[a-z0-9][a-z0-9-]{0,47}$/),
});

export const action = async ({ params, request }: ActionFunctionArgs) => {
  // Actions run BEFORE loaders — every cqms action authenticates itself
  // (ADR-017).
  const user = await requireUser({ request });

  const { scannerId } = parseRouteParams({
    invalidMessage: 'Invalid scanner id.',
    params,
    schema: paramsSchema,
  });

  const formData = await request.formData();
  const parsed = editScannerSchema.safeParse(
    readEditScannerFormValues({ formData }),
  );

  if (!parsed.success) {
    return { errors: toEditScannerFieldErrors({ error: parsed.error }) };
  }

  const values = parsed.data;
  try {
    await updateScanner({
      scanner: {
        ...toScannerWriteInput({ values }),
        is_active: values.isActive,
      },
      scannerId,
      userId: user.id,
    });

    // Same best-effort ensure as registration (ADR-023): the detail table
    // and on-disk artifacts exist after any save; never overwrites.
    try {
      await createScannerDetailTable({ scannerId, userId: user.id });
      writeScannerArtifacts(toScannerArtifactInput({ scannerId, values }));
    } catch (ensureError) {
      console.warn(
        'Scanner artifact/detail-table ensure failed (non-fatal):',
        ensureError,
      );
    }

    return redirect(`/cqms/scanners/view/${scannerId}`);
  } catch (error) {
    return {
      errors: {
        displayName: getErrorMessage({
          error,
          fallback: 'Failed to update scanner.',
        }),
      },
    };
  }
};
