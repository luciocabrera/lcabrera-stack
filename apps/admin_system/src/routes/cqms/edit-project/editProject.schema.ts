import { z } from 'zod';

export const editProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required.'),
});

export type EditProjectValues = z.infer<typeof editProjectSchema>;
