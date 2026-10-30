/**
 * Where the adjudication commands may read, write and spawn: a path is kept
 * only when it resolves inside the repository root, and a tool runs as its
 * own JavaScript entry under the running Node, never through a PATH lookup.
 */
import { createRequire } from 'node:module';
import { dirname, join, resolve, sep } from 'node:path';

export const repoPath = ({ path, root }) => {
  const resolved = resolve(root, path);
  if (resolved !== root && !resolved.startsWith(`${root}${sep}`)) {
    throw new Error(`${path} resolves outside the repository`);
  }
  return resolved;
};

export const CASE_ID = /^FP-\d{4}$/u;

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
