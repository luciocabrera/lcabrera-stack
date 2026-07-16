import { z } from 'zod';

import { isJsonObjectOrEmpty } from './isJsonObjectOrEmpty.util';

/**
 * The scanner fields both authoring forms post. Each route extends it with
 * its own: new-scanner adds `scannerId`, edit-scanner adds `isActive`
 * (scanner_id and skill_path are immutable, so they are not edit fields —
 * ADR-023).
 *
 * Mirrors fn_register_scanner's own validation so the user gets a field error
 * instead of a raised exception for the common mistakes; the DB stays the
 * authority.
 */
export const scannerFieldsSchema = z.object({
  allowedTools: z.string().trim(),
  commandTemplate: z.string().trim(),
  configDetection: z
    .string()
    .trim()
    .refine(isJsonObjectOrEmpty, 'Must be a valid JSON object (or empty).'),
  description: z.string().trim(),
  deterministic: z.boolean(),
  displayName: z.string().trim().min(1, 'Display name is required.'),
  rawArtifactFileName: z.string().trim(),
  stepsMarkdown: z.string().trim(),
  supportsDiffScope: z.boolean(),
});

export type ScannerFieldValues = z.infer<typeof scannerFieldsSchema>;
