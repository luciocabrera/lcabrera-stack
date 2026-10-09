import { z } from 'zod';

export const trialSortParamSchema = z.array(
  z.object({
    columnKey: z.string(),
    direction: z.enum(['asc', 'desc']),
  }),
);
