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

/** `apps/*` globs describe apps; everything else (packages/*) is a package. */
const kindOf = (glob) => (glob.startsWith('apps/') ? 'app' : 'pkg');

/**
 * The workspaces, derived from pnpm-workspace.yaml, each tagged with its `kind`
 * (`app` | `pkg`). Returns an empty array when the file is absent. The richer
 * shape powers the `app:`/`pkg:` label taxonomy; `deriveWorkspaceScopes` narrows
 * it to just the names for scope validation.
 */
export const deriveWorkspaces = (repoRoot) => {
  const yamlPath = join(repoRoot, 'pnpm-workspace.yaml');
  if (!existsSync(yamlPath)) {
    return [];
  }
  const workspaces = [];
  for (const glob of parsePackageGlobs(readFileSync(yamlPath, 'utf8'))) {
    const kind = kindOf(glob);
    if (glob.endsWith('/*')) {
      for (const name of expandStarGlob(repoRoot, glob.slice(0, -2))) {
        workspaces.push({ name, kind });
      }
    } else if (existsSync(join(repoRoot, glob, 'package.json'))) {
      workspaces.push({ name: basename(glob), kind });
    }
  }
  return workspaces;
};

/**
 * The recognised workspace scope names, derived from pnpm-workspace.yaml. Returns
 * an empty set when the file is absent (callers treat that as "no nudge").
 */
export const deriveWorkspaceScopes = (repoRoot) =>
  new Set(deriveWorkspaces(repoRoot).map((workspace) => workspace.name));

/**
 * The workspaces whose directory contains at least one of the given changed
 * files — the soft path→workspace mapping every change-scoped tool shares: a file
 * under `apps/<name>/` or `packages/<name>/` belongs to that workspace. `files`
 * are repo-relative paths; `workspaces` are `{ name, kind }` from
 * `deriveWorkspaces` (or a richer shape carrying those two fields).
 */
export const workspacesForFiles = (files, workspaces) => {
  const dir = { app: 'apps', pkg: 'packages' };
  return workspaces.filter((workspace) =>
    files.some((file) =>
      file.startsWith(`${dir[workspace.kind]}/${workspace.name}/`),
    ),
  );
};
