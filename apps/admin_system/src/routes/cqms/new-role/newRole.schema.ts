import { z } from 'zod';

/** Mirrors fn_create_role's own validation (ADR-024) for early field errors. */
export const newRoleSchema = z.object({
  description: z.string().trim(),
  permissionIds: z.array(z.string().uuid()).default([]),
  roleName: z
    .string()
    .trim()
    .regex(
      /^[a-z0-9][a-z0-9-]{1,63}$/,
      'Lowercase kebab-case, 2-64 chars (e.g. release-manager).',
    ),
});

export type NewRoleValues = z.infer<typeof newRoleSchema>;
