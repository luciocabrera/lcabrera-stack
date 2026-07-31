import { z } from 'zod';

/** role_name is immutable (the natural key the lockout guards reference). */
export const editRoleSchema = z.object({
  description: z.string().trim(),
  isEnabled: z.boolean(),
  permissionIds: z.array(z.uuid()).default([]),
});

export type EditRoleValues = z.infer<typeof editRoleSchema>;
