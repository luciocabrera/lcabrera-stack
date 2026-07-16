import type { ScannerFieldValues } from './scannerFields.schema';

import { parseAllowedTools } from './parseAllowedTools.util';

type ToScannerWriteInputArgs = {
  readonly values: ScannerFieldValues;
};

/**
 * Maps the shared form values onto the snake_case scanner row that
 * registerScanner and updateScanner both take. Each caller spreads its own
 * remaining column on top — `scanner_id` when registering, `is_active` when
 * updating.
 *
 * Blank optional text becomes undefined rather than '': the DB functions treat
 * an absent key as "leave unset", where '' would store an empty value.
 * `configDetection` is safe to JSON.parse here because the schema's refine has
 * already proven it parses.
 */
export const toScannerWriteInput = ({ values }: ToScannerWriteInputArgs) => ({
  allowed_tools: parseAllowedTools({ allowedTools: values.allowedTools }),
  command_template: values.commandTemplate || undefined,
  config_detection: values.configDetection
    ? (JSON.parse(values.configDetection) as Record<string, unknown>)
    : undefined,
  description: values.description || undefined,
  deterministic: values.deterministic,
  display_name: values.displayName,
  raw_artifact_file_name: values.rawArtifactFileName || undefined,
  steps_markdown: values.stepsMarkdown || undefined,
  supports_diff_scope: values.supportsDiffScope,
});
