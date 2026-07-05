import { z } from 'zod';

export const newProjectSchema = z.object({
  localPath: z.string().min(1, 'Local path is required.'),
  name: z.string().min(1, 'Project name is required.'),
});

export type NewProjectValues = z.infer<typeof newProjectSchema>;
