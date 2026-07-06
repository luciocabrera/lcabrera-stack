import path from 'node:path';

type ResolvePathWithinArgs = {
  readonly baseDirectory: string;
  readonly targetPath: string;
};

/**
 * The single containment gate every dynamic filesystem path in this package
 * flows through (security/detect-non-literal-fs-filename): resolves
 * `targetPath` (relative or absolute) against `baseDirectory` and throws if
 * the resolved path escapes that trusted base.
 */
export const resolvePathWithin = ({
  baseDirectory,
  targetPath,
}: ResolvePathWithinArgs): string => {
  const resolvedBase = path.resolve(baseDirectory);
  const resolvedTarget = path.resolve(resolvedBase, targetPath);

  const isContained =
    resolvedTarget === resolvedBase ||
    resolvedTarget.startsWith(`${resolvedBase}${path.sep}`);
  if (!isContained) {
    throw new Error(
      `Path escapes trusted base directory: ${targetPath} (base: ${baseDirectory})`,
    );
  }

  return resolvedTarget;
};
