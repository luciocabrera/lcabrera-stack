import { z } from 'zod';

export const triggerScanSchema = z.object({
  // Set once the user has seen and accepted the fan-out warning — a plain
  // boolean here, not parsed from raw FormData (the action derives it via
  // isCheckboxChecked, matching the shared Form's checkbox semantics).
  confirmFanOut: z.boolean().default(false),
  scannerIds: z.array(z.string()).min(1, 'Select at least one scanner.'),
  // Empty = one whole-repo scan per scanner (ADR-021).
  workspacePaths: z.array(z.string()).default([]),
});

export type TriggerScanValues = {
  readonly confirmFanOut: boolean;
  readonly scannerIds: string[];
  readonly workspacePaths: string[];
};
