/**
 * Where the adjudication commands may read, write and spawn: a path is kept
 * only when it resolves inside the repository root with symlinks followed,
 * and a tool runs as its own JavaScript entry under the running Node, never
 * through a PATH lookup.
 */
import { lstatSync, realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, relative, resolve, sep } from 'node:path';

const within = ({ path, root }) =>
  path === root || path.startsWith(`${root}${sep}`);

const exists = (path) => {
  try {
    lstatSync(path);
    return true;
  } catch {
    return false;
  }
};

const nearestEntry = (path) =>
  exists(path) ? path : nearestEntry(dirname(path));

const realOf = (path) => {
  try {
    return realpathSync(path);
  } catch {
    return undefined;
  }
};

export const repoPath = ({ path, root }) => {
  const resolved = resolve(root, path);
  const entry = nearestEntry(resolved);
  const real = realOf(entry);
  if (
    !within({ path: resolved, root: resolve(root) }) ||
    real === undefined ||
    !within({ path: real, root: realpathSync(root) })
  ) {
    throw new Error(`${path} resolves outside the repository`);
  }
  return join(real, relative(entry, resolved));
};

const CASE_ID = /^FP-\d{4}$/u;

export const caseIdFrom = (value) => {
  if (!CASE_ID.test(value)) {
    throw new Error(`"${value}" is not a case id of the form FP-nnnn`);
  }
  return value;
};

const TOOL_PACKAGES = {
  biome: { bin: 'biome', name: '@biomejs/biome' },
  eslint: { bin: 'eslint', name: 'eslint' },
  fallow: { bin: 'fallow', name: 'fallow' },
  vp: { bin: 'vp', name: 'vite-plus' },
};

export const toolEntry = ({ from, tool }) => {
  const known = TOOL_PACKAGES[tool];
  if (known === undefined) throw new Error(`no tool named "${tool}"`);
  const load = createRequire(join(from, 'package.json'));
  const manifest = `${known.name}/package.json`;
  return join(dirname(load.resolve(manifest)), load(manifest).bin[known.bin]);
};
