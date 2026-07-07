/**
 * Extracts workspace globs from a parsed package.json (npm/yarn
 * convention): either `"workspaces": ["apps/*"]` or the object form
 * `"workspaces": { "packages": ["apps/*"] }`. Unknown shapes degrade to
 * an empty list — discovery is best-effort by contract (ADR-021).
 */
export const parsePackageJsonWorkspaces = (
  packageJson: unknown,
): readonly string[] => {
  if (packageJson === null || typeof packageJson !== 'object') {
    return [];
  }

  const { workspaces } = packageJson as { workspaces?: unknown };
  const rawList = Array.isArray(workspaces)
    ? workspaces
    : workspaces !== null &&
        typeof workspaces === 'object' &&
        Array.isArray((workspaces as { packages?: unknown }).packages)
      ? (workspaces as { packages: unknown[] }).packages
      : [];

  return rawList.filter(
    (entry): entry is string => typeof entry === 'string' && entry.length > 0,
  );
};
