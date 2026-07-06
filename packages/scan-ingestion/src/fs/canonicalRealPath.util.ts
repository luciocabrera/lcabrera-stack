import { realpathSync } from 'node:fs';

/**
 * Canonicalizes an operator-supplied path (project registration, git-root
 * resolution, temp-dir creation) into the trusted absolute form that every
 * downstream containment check (`resolvePathWithin`) validates against.
 */
export const canonicalRealPath = (targetPath: string): string =>
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- realpathSync IS the canonicalization step that establishes the trusted base path; it reads no file contents and its output feeds resolvePathWithin containment checks
  realpathSync(targetPath);
