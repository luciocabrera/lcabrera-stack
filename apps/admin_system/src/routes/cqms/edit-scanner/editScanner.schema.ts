import { z } from 'zod';

const isJsonObjectOrEmpty = (value: string) => {
  if (value === '') return true;
  try {
    const parsed: unknown = JSON.parse(value);
    return typeof parsed === 'object' && parsed !== null;
  } catch {
    return false;
  }
};

/** scanner_id and skill_path are immutable (ADR-023) — not form fields. */
export const editScannerSchema = z.object({
  allowedTools: z.string().trim(),
  commandTemplate: z.string().trim(),
  configDetection: z
    .string()
    .trim()
    .refine(isJsonObjectOrEmpty, 'Must be a valid JSON object (or empty).'),
  description: z.string().trim(),
  deterministic: z.boolean(),
  displayName: z.string().trim().min(1, 'Display name is required.'),
  isActive: z.boolean(),
  rawArtifactFileName: z.string().trim(),
  stepsMarkdown: z.string().trim(),
  supportsDiffScope: z.boolean(),
});

export type EditScannerValues = z.infer<typeof editScannerSchema>;
