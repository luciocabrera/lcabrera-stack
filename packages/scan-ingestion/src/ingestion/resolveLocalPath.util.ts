import { realpathSync } from 'node:fs';

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
 */
export const resolveLocalPath = ({ localPath }: ResolveLocalPathArgs): string =>
  realpathSync(localPath);
