import { createScannerDetailTable } from '@repo/scan-ingestion/queries/createScannerDetailTable.util';
import { updateScanner } from '@repo/scan-ingestion/queries/updateScanner.util';
import { writeScannerArtifacts } from '@repo/scan-ingestion/registry/writeScannerArtifacts.util';
import { type ActionFunctionArgs, data, redirect } from 'react-router';
import { z } from 'zod';

import { requireUser } from '@/auth/requireUser.util';

import { isCheckboxChecked } from '../utils/isCheckboxChecked.util';
import { editScannerSchema } from './editScanner.schema';

const paramsSchema = z.object({
  scannerId: z.string().regex(/^[a-z0-9][a-z0-9-]{0,47}$/),
});

export const action = async ({ params, request }: ActionFunctionArgs) => {
  // Actions run BEFORE loaders — every cqms action authenticates itself
  // (ADR-017).
  const user = await requireUser({ request });

  const parsedParams = paramsSchema.safeParse(params);
  if (!parsedParams.success) {
    throw data('Invalid scanner id.', { status: 400 });
  }
  const { scannerId } = parsedParams.data;

  const formData = await request.formData();
  const parsed = editScannerSchema.safeParse({
    allowedTools: formData.get('allowedTools') ?? '',
    commandTemplate: formData.get('commandTemplate') ?? '',
    configDetection: formData.get('configDetection') ?? '',
    description: formData.get('description') ?? '',
    deterministic: isCheckboxChecked({ formData, name: 'deterministic' }),
    displayName: formData.get('displayName') ?? '',
    isActive: isCheckboxChecked({ formData, name: 'isActive' }),
    rawArtifactFileName: formData.get('rawArtifactFileName') ?? '',
    stepsMarkdown: formData.get('stepsMarkdown') ?? '',
    supportsDiffScope: isCheckboxChecked({
      formData,
      name: 'supportsDiffScope',
    }),
  });

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return {
      errors: {
        configDetection: fieldErrors.configDetection?.[0],
        displayName: fieldErrors.displayName?.[0],
      },
    };
  }

  const values = parsed.data;
  try {
    await updateScanner({
      scanner: {
        allowed_tools: values.allowedTools
          ? values.allowedTools.split(',').map((tool) => tool.trim())
          : undefined,
        command_template: values.commandTemplate || undefined,
        config_detection: values.configDetection
          ? (JSON.parse(values.configDetection) as Record<string, unknown>)
          : undefined,
        description: values.description || undefined,
        deterministic: values.deterministic,
        display_name: values.displayName,
        is_active: values.isActive,
        raw_artifact_file_name: values.rawArtifactFileName || undefined,
        steps_markdown: values.stepsMarkdown || undefined,
        supports_diff_scope: values.supportsDiffScope,
      },
      scannerId,
      userId: user.id,
    });

    // Same best-effort ensure as registration (ADR-023): the detail table
    // and on-disk artifacts exist after any save; never overwrites.
    try {
      await createScannerDetailTable({ scannerId, userId: user.id });
      writeScannerArtifacts({
        allowedTools: values.allowedTools
          ? values.allowedTools.split(',').map((tool) => tool.trim())
          : undefined,
        description: values.description || undefined,
        displayName: values.displayName,
        isDeterministic: values.deterministic,
        rawArtifactFileName: values.rawArtifactFileName || undefined,
        scannerId,
        stepsMarkdown: values.stepsMarkdown || undefined,
      });
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
        displayName:
          error instanceof Error ? error.message : 'Failed to update scanner.',
      },
    };
  }
};
