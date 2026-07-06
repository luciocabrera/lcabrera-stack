import { canonicalRealPath } from '../fs/canonicalRealPath.util.ts';

type ResolveLocalPathArgs = {
  readonly localPath: string;
};

/**
 * Canonicalizes a UI-supplied path for registerProject/updateProject —
 * realpath only (resolves symlinks, normalizes `.`/`..`), no git-root
 * walking. Distinct from resolveProjectPath (matchProject.util.ts), which
 * exists specifically for the ad hoc interactive-session path's own
 * auto-matching need. Reusing that git-root-walking logic here was a real
 * bug: any subfolder of an already-registered repo silently canonicalized
 * back to that repo's root, making it impossible to register or edit a
 * project to point at a specific subfolder (e.g. `packages/ui`) distinct
 * from the whole repo — an edit to a different subfolder of the same repo
 * appeared to silently do nothing.
 *
 * Also doubles as the existence check (the filesystem check Zod cannot do
 * at the boundary — TECH_SPEC §2.4): realpath throws for a missing path,
 * surfaced as the caller-facing "Path does not exist" error.
 */
export const resolveLocalPath = ({
  localPath,
}: ResolveLocalPathArgs): string => {
  try {
    return canonicalRealPath(localPath);
  } catch {
    throw new Error(`Path does not exist: ${localPath}`);
  }
};
