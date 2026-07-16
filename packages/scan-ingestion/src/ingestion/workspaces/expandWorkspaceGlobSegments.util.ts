import path from 'node:path';

import { isExistingPathWithin } from '../../fs/isExistingPathWithin.util.ts';
import { listWorkspaceSubdirectories } from './listWorkspaceSubdirectories.util.ts';

type ExpandWorkspaceGlobSegmentsArgs = {
  readonly baseRelative: string;
  readonly rootPath: string;
  readonly segments: readonly string[];
};

/**
 * Recursively expands one glob's `/`-split segments against the real
 * directory tree (ADR-021): a `*` segment fans out over the current
 * level's subdirectories, a literal segment must exist to continue.
 * Returns every project-root-relative path the glob reaches.
 */
export const expandWorkspaceGlobSegments = ({
  baseRelative,
  rootPath,
  segments,
}: ExpandWorkspaceGlobSegmentsArgs): readonly string[] => {
  const [head, ...rest] = segments;
  if (head === undefined) {
    return [baseRelative];
  }

  const candidates =
    head === '*'
      ? listWorkspaceSubdirectories({ relativePath: baseRelative, rootPath })
      : [head];

  return candidates.flatMap((segment) => {
    const nextRelative = baseRelative
      ? path.posix.join(baseRelative, segment)
      : segment;
    return isExistingPathWithin({
      baseDirectory: rootPath,
      targetPath: nextRelative,
    })
      ? expandWorkspaceGlobSegments({
          baseRelative: nextRelative,
          rootPath,
          segments: rest,
        })
      : [];
  });
};
