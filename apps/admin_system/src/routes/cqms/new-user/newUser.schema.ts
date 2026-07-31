import { z } from 'zod';

/** Mirrors fn_create_user's own validation (ADR-024) for early field errors. */
export const newUserSchema = z.object({
  displayName: z.string().trim().min(1, 'Display name is required.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  roleIds: z.array(z.uuid()).default([]),
  username: z
    .string()
    .trim()
    .regex(
      /^[a-z0-9][a-z0-9._-]{1,63}$/,
      'Lowercase alphanumeric (dots, dashes, underscores allowed), 2-64 chars.',
    ),
});

export type NewUserValues = z.infer<typeof newUserSchema>;
