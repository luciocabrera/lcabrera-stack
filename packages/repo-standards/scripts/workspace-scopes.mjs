/**
 * Derives the set of workspace scope names (ui, server, react-router, …) from
 * `pnpm-workspace.yaml`, so the commit/PR scope vocabulary self-updates whenever a
 * workspace is added — no hand-maintained list to rot. Effectful (reads the
 * filesystem); kept out of the pure `commit-convention.mjs` spec so that stays
 * unit-testable without a repo on disk. See `.claude/rules/scripts.md`.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';

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

const kindOf = (glob) => (glob.startsWith('apps/') ? 'app' : 'pkg');

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

export const deriveWorkspaceScopes = (repoRoot) =>
  new Set(deriveWorkspaces(repoRoot).map((workspace) => workspace.name));

export const workspacesForFiles = (files, workspaces) => {
  const dir = { app: 'apps', pkg: 'packages' };
  return workspaces.filter((workspace) =>
    files.some((file) =>
      file.startsWith(`${dir[workspace.kind]}/${workspace.name}/`),
    ),
  );
};
