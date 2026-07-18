/**
 * Derives the set of workspace scope names (ui, admin_system, api-server, …) from
 * `pnpm-workspace.yaml`, so the commit/PR scope vocabulary self-updates whenever a
 * workspace is added — no hand-maintained list to rot. Effectful (reads the
 * filesystem); kept out of the pure `commit-convention.mjs` spec so that stays
 * unit-testable without a repo on disk. See `.claude/rules/scripts.md`.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';

/** Parses the `packages:` list of a pnpm-workspace.yaml into its glob entries. */
const parsePackageGlobs = (yaml) => {
  const globs = [];
  let inList = false;
  for (const line of yaml.split(/\r?\n/)) {
    if (/^packages:\s*$/.test(line)) {
      inList = true;
      continue;
    }
    if (!inList) {
      continue;
    }
    const entry = /^\s+-\s+['"]?([^'"\s]+)['"]?\s*$/.exec(line);
    if (entry !== null) {
      globs.push(entry[1]);
    } else if (/^\S/.test(line)) {
      break;
    }
  }
  return globs;
};

/** Directory basenames matching a `<prefix>/*` glob that contain a package.json. */
const expandStarGlob = (repoRoot, prefix) => {
  const dir = join(repoRoot, prefix);
  if (!existsSync(dir)) {
    return [];
  }
  return readdirSync(dir, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isDirectory() &&
        existsSync(join(dir, entry.name, 'package.json')),
    )
    .map((entry) => entry.name);
};

/**
 * The recognised workspace scope names, derived from pnpm-workspace.yaml. Returns
 * an empty set when the file is absent (callers treat that as "no nudge").
 */
export const deriveWorkspaceScopes = (repoRoot) => {
  const yamlPath = join(repoRoot, 'pnpm-workspace.yaml');
  if (!existsSync(yamlPath)) {
    return new Set();
  }
  const names = new Set();
  for (const glob of parsePackageGlobs(readFileSync(yamlPath, 'utf8'))) {
    if (glob.endsWith('/*')) {
      for (const name of expandStarGlob(repoRoot, glob.slice(0, -2))) {
        names.add(name);
      }
    } else if (existsSync(join(repoRoot, glob, 'package.json'))) {
      names.add(basename(glob));
    }
  }
  return names;
};
