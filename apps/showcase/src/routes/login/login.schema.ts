import { z } from 'zod';

/**
 * Email format regex, shared by the Zod gate and the Form field's
 * `clientValidation.pattern` so the browser-side and server-side checks can never
 * disagree.
 * Deliberately a regex (not Zod's `.email()`) to showcase the `pattern` validation kind
 * end to end.
 */
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+\.[^\s@]+$/;

export const PASSWORD_MIN_LENGTH = 8;

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required.')
    .regex(EMAIL_PATTERN, 'Enter a valid email address.'),
  password: z
    .string()
    .min(1, 'Password is required.')
    .min(
      PASSWORD_MIN_LENGTH,
      `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`,
    ),
});

export type LoginValues = z.infer<typeof loginSchema>;
