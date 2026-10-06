/**
 * Pure core of the React Doctor gate (`./verify-react-doctor.mjs`): how one
 * error-severity finding prints.
 *
 * The finding comes from react-doctor's JSON report, which this package does
 * not control, so its `id` may be a string, `null` or missing. Only a string
 * names the repository path; anything else falls back to the normalized file
 * path.
 */

export const renderFinding = ({
  id,
  line,
  message,
  normalizedFilePath,
  rule,
}) => {
  const [repoPath] = typeof id === 'string' ? id.split('::', 1) : [];
  return `  ${repoPath || normalizedFilePath}:${line}  ${rule}\n      ${message}`;
};
