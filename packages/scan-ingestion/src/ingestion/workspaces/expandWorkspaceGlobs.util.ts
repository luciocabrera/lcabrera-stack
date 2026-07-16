import path from 'node:path';

import { isExistingPathWithin } from '../../fs/isExistingPathWithin.util.ts';
import { expandWorkspaceGlobSegments } from './expandWorkspaceGlobSegments.util.ts';

type ExpandWorkspaceGlobsArgs = {
  readonly globs: readonly string[];
  readonly rootPath: string;
};

// Expands workspace globs into project-root-relative directory paths
// (ADR-021). A directory qualifies iff it contains a package.json — the
// same rule pnpm applies. Supported: exact paths ('apps/web'), star
// segments at any depth ('apps/*', 'packages/*/plugins'), and '!'
// negations (applied after expansion). '**' is deliberately not supported
// — none of this repo's targets use it, and best-effort discovery
// degrades to fewer results, never errors. All filesystem access flows
// through the fs/*Within containment gates. (Line comments on purpose:
// glob examples containing star-slash would terminate a block comment.)
export const expandWorkspaceGlobs = ({
  globs,
  rootPath,
}: ExpandWorkspaceGlobsArgs): readonly string[] => {
  const includeGlobs = globs.filter((glob) => !glob.startsWith('!'));
  const excludedExact = new Set(
    globs
      .filter((glob) => glob.startsWith('!'))
      .map((glob) => glob.slice(1).replace(/\/$/, '')),
  );

  const expanded = includeGlobs.flatMap((glob) =>
    expandWorkspaceGlobSegments({
      baseRelative: '',
      rootPath,
      segments: glob.replace(/\/$/, '').split('/'),
    }),
  );

  const unique = [...new Set(expanded)];
  return unique
    .filter(
      (relativePath) =>
        !excludedExact.has(relativePath) &&
        relativePath.length > 0 &&
        isExistingPathWithin({
          baseDirectory: rootPath,
          targetPath: path.posix.join(relativePath, 'package.json'),
        }),
    )
    .toSorted((left, right) => left.localeCompare(right));
};
