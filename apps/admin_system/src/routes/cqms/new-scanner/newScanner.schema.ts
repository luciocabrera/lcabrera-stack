import { z } from 'zod';

const isJsonObjectOrEmpty = (value: string): boolean => {
  if (value === '') return true;
  try {
    const parsed: unknown = JSON.parse(value);
    return typeof parsed === 'object' && parsed !== null;
  } catch {
    return false;
  }
};

/**
 * Mirrors fn_register_scanner's own validation (ADR-023) so the user gets
 * a field error instead of a raised exception for the common mistakes; the
 * DB stays the authority.
 */
export const newScannerSchema = z.object({
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
  scannerId: z
    .string()
    .trim()
    .regex(
      /^[a-z0-9][a-z0-9-]{0,47}$/,
      'Lowercase kebab-case, max 48 chars (e.g. my-scanner).',
    ),
  stepsMarkdown: z.string().trim(),
  supportsDiffScope: z.boolean(),
});

export type NewScannerValues = z.infer<typeof newScannerSchema>;
