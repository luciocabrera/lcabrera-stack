import { z } from 'zod';

import { scannerFieldsSchema } from '../utils/scannerFields.schema';

/** The shared scanner fields plus the immutable id only registration sets. */
export const newScannerSchema = scannerFieldsSchema.extend({
  scannerId: z
    .string()
    .trim()
    .regex(
      /^[a-z0-9][a-z0-9-]{0,47}$/,
      'Lowercase kebab-case, max 48 chars (e.g. my-scanner).',
    ),
});

export type NewScannerValues = z.infer<typeof newScannerSchema>;
