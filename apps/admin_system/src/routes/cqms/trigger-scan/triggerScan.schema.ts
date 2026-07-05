import { z } from 'zod';

export const triggerScanSchema = z.object({
  scannerIds: z.array(z.string()).min(1, 'Select at least one scanner.'),
});

export type TriggerScanValues = {
  readonly scannerIds: string[];
};
