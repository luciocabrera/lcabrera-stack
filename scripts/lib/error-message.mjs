/**
 * A printable message for anything a `catch` can receive.
 *
 * Why this exists: `throw` accepts any value, not just an `Error`, so a top-level
 * `catch (error)` that prints `error.message` renders `undefined` for a thrown
 * string, object or `null` — the failure output is destroyed exactly when
 * something unexpected went wrong and the message mattered most. Most throws in
 * this repo are real Errors; this is about the ones that are not.
 *
 * Governed by .claude/rules/scripts.md.
 */

/**
 * `error.message` for an Error, a readable rendering otherwise. Never throws —
 * a getter that itself throws, or an object with no useful string form, still
 * yields something printable rather than replacing the original failure.
 */
export const errorMessage = (value) => {
  try {
    if (value instanceof Error) {
      return value.message === '' ? value.name : value.message;
    }
    if (typeof value === 'string') {
      return value === '' ? 'empty string thrown' : value;
    }
    return `non-Error thrown: ${JSON.stringify(value) ?? String(value)}`;
  } catch {
    return 'unprintable failure value';
  }
};
