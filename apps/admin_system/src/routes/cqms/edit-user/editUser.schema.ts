import { z } from 'zod';

/** username is immutable (the natural key admin routes are keyed by). */
export const editUserSchema = z.object({
  displayName: z.string().trim().min(1, 'Display name is required.'),
  isEnabled: z.boolean(),
  newPassword: z
    .string()
    .refine(
      (value) => value === '' || value.length >= 8,
      'Password must be at least 8 characters (leave empty to keep the current one).',
    ),
  roleIds: z.array(z.string().uuid()).default([]),
});

export type EditUserValues = z.infer<typeof editUserSchema>;
