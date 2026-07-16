import { z } from 'zod';

import { scannerFieldsSchema } from '../utils/scannerFields.schema';

/**
 * The shared scanner fields plus the active toggle. scanner_id and skill_path
 * are immutable (ADR-023) — not form fields.
 */
export const editScannerSchema = scannerFieldsSchema.extend({
  isActive: z.boolean(),
});

export type EditScannerValues = z.infer<typeof editScannerSchema>;
