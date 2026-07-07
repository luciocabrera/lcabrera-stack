import { z } from 'zod';

export const triggerScanSchema = z.object({
  scannerIds: z.array(z.string()).min(1, 'Select at least one scanner.'),
  // Empty = one whole-repo scan per scanner (ADR-021).
  workspacePaths: z.array(z.string()).default([]),
});

export type TriggerScanValues = {
  readonly scannerIds: string[];
  readonly workspacePaths: string[];
};
