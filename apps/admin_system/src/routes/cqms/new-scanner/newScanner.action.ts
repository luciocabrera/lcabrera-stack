import { createScannerDetailTable } from '@repo/scan-ingestion/queries/createScannerDetailTable.util';
import { registerScanner } from '@repo/scan-ingestion/queries/registerScanner.util';
import { writeScannerArtifacts } from '@repo/scan-ingestion/registry/writeScannerArtifacts.util';
import { type ActionFunctionArgs, redirect } from 'react-router';

import { requireUser } from '@/auth/requireUser.util';

import { isCheckboxChecked } from '../utils/isCheckboxChecked.util';
import { newScannerSchema } from './newScanner.schema';

export const action = async ({ request }: ActionFunctionArgs) => {
  // Actions run BEFORE loaders, so the layout loader's gate does not
  // cover POSTs — every cqms action authenticates itself (ADR-017).
  const user = await requireUser({ request });

  const formData = await request.formData();
  const parsed = newScannerSchema.safeParse({
    allowedTools: formData.get('allowedTools') ?? '',
    commandTemplate: formData.get('commandTemplate') ?? '',
    configDetection: formData.get('configDetection') ?? '',
    description: formData.get('description') ?? '',
    deterministic: isCheckboxChecked({ formData, name: 'deterministic' }),
    displayName: formData.get('displayName') ?? '',
    rawArtifactFileName: formData.get('rawArtifactFileName') ?? '',
    scannerId: formData.get('scannerId') ?? '',
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
        scannerId: fieldErrors.scannerId?.[0],
      },
    };
  }

  const values = parsed.data;
  try {
    const { scannerId } = await registerScanner({
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
        raw_artifact_file_name: values.rawArtifactFileName || undefined,
        scanner_id: values.scannerId,
        steps_markdown: values.stepsMarkdown || undefined,
        supports_diff_scope: values.supportsDiffScope,
      },
      userId: user.id,
    });

    await createScannerDetailTable({ scannerId, userId: user.id });

    // Best-effort artifact scaffolding (ADR-023) — the registry row is
    // committed; a filesystem failure must not roll registration back.
    // Never overwrites: code on disk stays authoritative.
    try {
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
        scannerId:
          error instanceof Error
            ? error.message
            : 'Failed to register scanner.',
      },
    };
  }
};
