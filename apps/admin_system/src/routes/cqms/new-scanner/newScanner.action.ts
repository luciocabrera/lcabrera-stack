import type { ActionFunctionArgs } from 'react-router';

import { getErrorMessage } from '@lcabrera/utils/errors/get-error-message.util';
import { createScannerDetailTable } from '@repo/scan-ingestion/queries/createScannerDetailTable.util';
import { registerScanner } from '@repo/scan-ingestion/queries/registerScanner.util';
import { writeScannerArtifacts } from '@repo/scan-ingestion/registry/writeScannerArtifacts.util';
import { redirect } from 'react-router';

import { requireUser } from '@/auth/requireUser.util';

import { toScannerArtifactInput } from '../utils/toScannerArtifactInput.util';
import { toScannerWriteInput } from '../utils/toScannerWriteInput.util';
import { newScannerSchema } from './newScanner.schema';
import { readNewScannerFormValues } from './readNewScannerFormValues.util';
import { toNewScannerFieldErrors } from './toNewScannerFieldErrors.util';

export const action = async ({ request }: ActionFunctionArgs) => {
  // Actions run BEFORE loaders, so the layout loader's gate does not
  // cover POSTs — every cqms action authenticates itself (ADR-017).
  const user = await requireUser({ request });

  const formData = await request.formData();
  const parsed = newScannerSchema.safeParse(
    readNewScannerFormValues({ formData }),
  );

  if (!parsed.success) {
    return { errors: toNewScannerFieldErrors({ error: parsed.error }) };
  }

  const values = parsed.data;
  try {
    const { scannerId } = await registerScanner({
      scanner: {
        ...toScannerWriteInput({ values }),
        scanner_id: values.scannerId,
      },
      userId: user.id,
    });

    await createScannerDetailTable({ scannerId, userId: user.id });

    // Best-effort artifact scaffolding (ADR-023) — the registry row is
    // committed; a filesystem failure must not roll registration back.
    // Never overwrites: code on disk stays authoritative.
    try {
      writeScannerArtifacts(toScannerArtifactInput({ scannerId, values }));
    } catch (artifactError) {
      console.warn(
        'Scanner artifact scaffolding failed (non-fatal):',
        artifactError,
      );
    }

    return redirect(`/cqms/scanners/view/${scannerId}`);
  } catch (error) {
    return {
      errors: {
        scannerId: getErrorMessage({
          error,
          fallback: 'Failed to register scanner.',
        }),
      },
    };
  }
};
