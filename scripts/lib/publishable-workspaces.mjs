/**
 * Every workspace manifest that can reach the registry — the starting point
 * both release scripts share (`release-publish-plan.mjs`, `release-audit.mjs`).
 *
 * `private` is the whole filter, because it is the whole filter
 * `changeset publish` applies: it walks every non-private workspace regardless
 * of directory, and `config.ignore` does not narrow it. Scanning only
 * `packages/` would therefore miss a non-private app and under-report, which is
 * the one direction either script must not fail in.
 *
 * Effectful (reads the filesystem) and so kept out of the pure modules beside
 * it; `repoRoot` is a parameter rather than derived here so a caller's root is
 * never guessed. See `.claude/rules/scripts.md`.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const WORKSPACE_DIRS = ['apps', 'packages'];

export const readPublishableManifests = (repoRoot) =>
  WORKSPACE_DIRS.flatMap((workspaceDir) => {
    const root = join(repoRoot, workspaceDir);

    return existsSync(root)
      ? readdirSync(root).map((name) => join(root, name, 'package.json'))
      : [];
  })
    .filter((manifestPath) => existsSync(manifestPath))
    .map((manifestPath) => JSON.parse(readFileSync(manifestPath, 'utf8')))
    .filter((manifest) => manifest.private !== true && manifest.name);
