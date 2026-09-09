/**
 * Pure decisions the PR-review submitter makes before it talks to GitHub.
 *
 * Governed by .claude/rules/scripts.md.
 */

export const refuseReason = ({ body, placeholder }) => {
  if (typeof body !== 'string' || body.trim() === '') {
    return 'empty';
  }
  if (
    typeof placeholder === 'string' &&
    placeholder !== '' &&
    body.trim() === placeholder
  ) {
    return 'placeholder';
  }
  return undefined;
};

export const flattenPages = (parsed) =>
  Array.isArray(parsed) ? parsed.flat() : [];
