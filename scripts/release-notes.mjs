/**
 * Print the GitHub Release body for one published package tag.
 *
 * `changeset publish` emits tags as `<package-name>@<version>`; this resolves
 * that back to the workspace's `CHANGELOG.md` and prints the matching section.
 * It exists because #620 removes `changesets/action` — the action could not
 * publish without also versioning, which is the whole defect — and the release
 * notes were the one thing it did that `changeset publish` does not.
 *
 * Prints nothing and exits 0 when the section cannot be found. By the time this
 * runs the package is already on npm and npm is permanent, so failing here would
 * turn a completed publish into a red job with nothing to retry.
 *
 * Usage (from the repo root):
 *   node scripts/release-notes.mjs '@lcabrera/utils@0.2.0'
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { extractChangelogSection } from './lib/release-publishable.mjs';

const REPO_ROOT = resolve(fileURLToPath(import.meta.url), '../..');
const WORKSPACE_DIRS = ['apps', 'packages'];

/** Split `@scope/name@1.2.3` — the leading `@` rules out a plain `split('@')`. */
const parseTag = (tag) => {
  const at = tag.lastIndexOf('@');

  return at <= 0
    ? undefined
    : { name: tag.slice(0, at), version: tag.slice(at + 1) };
};

/** The directory whose manifest declares `name`, or `undefined`. */
const findPackageDir = (name) =>
  WORKSPACE_DIRS.flatMap((workspaceDir) => {
    const root = join(REPO_ROOT, workspaceDir);

    return existsSync(root)
      ? readdirSync(root).map((entry) => join(root, entry))
      : [];
  }).find((directory) => {
    const manifestPath = join(directory, 'package.json');

    return (
      existsSync(manifestPath) &&
      JSON.parse(readFileSync(manifestPath, 'utf8')).name === name
    );
  });

const main = () => {
  const parsed = parseTag(process.argv[2] ?? '');

  if (!parsed) {
    return;
  }

  const directory = findPackageDir(parsed.name);
  const changelogPath = directory && join(directory, 'CHANGELOG.md');

  if (!changelogPath || !existsSync(changelogPath)) {
    return;
  }

  process.stdout.write(
    extractChangelogSection({
      changelog: readFileSync(changelogPath, 'utf8'),
      version: parsed.version,
    }),
  );
};

main();
