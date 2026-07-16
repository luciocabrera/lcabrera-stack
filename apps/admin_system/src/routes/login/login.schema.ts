import { z } from 'zod';

export const loginSchema = z.object({
  password: z.string().min(1, 'Password is required.'),
  username: z.string().min(1, 'Username is required.'),
});

export type LoginValues = z.infer<typeof loginSchema>;
