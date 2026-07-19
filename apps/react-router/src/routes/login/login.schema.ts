import { z } from 'zod';

/**
 * Email format regex, shared by the Zod gate and the Form field's
 * `clientValidation.pattern` so the browser-side and server-side checks can
 * never disagree. Deliberately a regex (not Zod's `.email()`) to showcase the
 * `pattern` validation kind end to end.
 *
 * Written to be **linear / ReDoS-safe**: the first domain label excludes `.`
 * (`[^\s@.]+`), so the `\.` separator is an unambiguous anchor — the engine
 * cannot split the domain part multiple ways and backtrack super-linearly on
 * an input like `a@bbbbbbbbbbbb` (the pattern Sonar S8786 flagged). It keeps a
 * flat star height (no quantifier over a quantified group) so `safe-regex`
 * (eslint `security/detect-unsafe-regex`) is satisfied too. Still requires a
 * dotted domain (`label.rest`) and allows dots in the local part and later
 * domain labels.
 */
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+\.[^\s@]+$/;

/** Minimum password length — exercises the `minLength` validation kind. */
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
