import { z } from 'zod';

export const editProjectSchema = z.object({
  localPath: z.string().min(1, 'Local path is required.'),
  name: z.string().min(1, 'Project name is required.'),
});

export type EditProjectValues = z.infer<typeof editProjectSchema>;
