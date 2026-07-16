import type { ZodError } from 'zod';

type GetFirstIssueMessageArgs = {
  readonly error: ZodError;
  readonly fallback: string;
};

/**
 * The first message from a failed safeParse, for the actions that surface a
 * single inline error rather than per-field ones.
 *
 * A ZodError always carries at least one issue, so the fallback is really
 * there because `issues[0]` is `Issue | undefined` under
 * noUncheckedIndexedAccess.
 */
export const getFirstIssueMessage = ({
  error,
  fallback,
}: GetFirstIssueMessageArgs) => error.issues[0]?.message ?? fallback;
