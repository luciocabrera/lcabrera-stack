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

  const toGlobList = (): readonly unknown[] => {
    if (Array.isArray(workspaces)) {
      return workspaces;
    }
    if (workspaces === null || typeof workspaces !== 'object') {
      return [];
    }
    const { packages } = workspaces as { packages?: unknown };
    return Array.isArray(packages) ? packages : [];
  };

  return toGlobList().filter(
    (entry): entry is string => typeof entry === 'string' && entry.length > 0,
  );
};
