/*
 * The tree and plan the retirement guard suites share: a repository inside a
 * scratch parent that holds a file outside it, and one record planned and
 * applied against it with the filesystem probes a real run uses.
 *
 * Test scaffolding: the `files` negation for `*-fixtures.*` keeps it out of the
 * tarball.
 */

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { DEFAULT_CONFIG } from './config.mjs';
import { hashContent } from './manifest.mjs';
import { destinationIn, nodeKindIn } from './retirement.mjs';
import { applySync, manifestAfter, onDiskHasher, planSync } from './sync.mjs';

export const RETIREMENT_CONFIG = {
  ...DEFAULT_CONFIG,
  paths: { ...DEFAULT_CONFIG.paths, lower: 'app' },
};

export const LOWER = { content: 'lower body', path: 'lower/kept.md' };

export const VICTIM = 'victim body';

export const scratchRepositories = () => {
  const scratches = [];
  return {
    drain: () => {
      const drained = [...scratches];
      scratches.length = 0;
      for (const path of drained) {
        rmSync(path, { force: true, recursive: true });
      }
    },
    scratchRepository: () => {
      const parent = mkdtempSync(join(tmpdir(), 'devkit-guards-'));
      scratches.push(parent);
      const root = join(parent, 'repo');
      mkdirSync(root);
      writeFileSync(join(parent, 'victim.txt'), VICTIM);
      return { parent, root };
    },
  };
};

const tracked = (hasher) => {
  const read = [];
  return {
    onDiskHash: (path) => {
      read.push(path);
      return hasher(path);
    },
    read,
  };
};

/**
 * @param {{ assets?: { path: string, content: string }[],
 *   kitGroups?: readonly string[], path: string, root: string }} args
 */
export const syncRecord = ({
  assets = [LOWER],
  kitGroups = ['lower'],
  path,
  root,
}) => {
  const { onDiskHash, read } = tracked(onDiskHasher(root));
  const manifest = { files: { [path]: hashContent(VICTIM) } };
  const entries = planSync({
    assets,
    config: RETIREMENT_CONFIG,
    destinationOf: destinationIn(root),
    groups: ['lower'],
    kindOf: nodeKindIn(root),
    kitGroups,
    manifest,
    onDiskHash,
  });
  applySync({ entries, root });
  return {
    hashed: read.includes(path),
    recorded: Object.hasOwn(
      manifestAfter({ entries, previous: manifest, version: '0' }).files,
      path,
    ),
    state: entries.find((entry) => entry.path === path)?.state,
  };
};
