import { z } from 'zod';

export const newProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required.'),
});

export type NewProjectValues = z.infer<typeof newProjectSchema>;
