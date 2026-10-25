/**
 * The I/O behind verify-changesets.mjs: the change against the merge base, the
 * workspace manifests on both sides, each package's packed file list, and the
 * packages the change's own changesets name. A file list is read out of the
 * tarball `pnpm pack` writes, because the packer that publishes is the only
 * authority on what ships.
 */
import {
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { getReleasePlan } from '@changesets/get-release-plan';

import { readPublishing } from '../../packages/repo-standards/scripts/config.mjs';
import { runGit } from '../../packages/repo-standards/scripts/git-exec.mjs';
import { packAndRead } from '../../packages/repo-standards/scripts/publish-pack.mjs';
import { parseNameStatus, untrackedChanges } from './changeset-required.mjs';

const DEPENDENCY_FIELDS = new Set([
  'bundleDependencies',
  'bundledDependencies',
  'dependencies',
  'devDependencies',
  'optionalDependencies',
  'peerDependencies',
]);

const gitOrThrow = (args, cwd) => {
  const output = runGit({ args, cwd });
  if (output === undefined) {
    throw new Error(
      `\`git ${args.join(' ')}\` failed — refusing to report a pass on no data.`,
    );
  }
  return output;
};

export const resolveMergeBase = ({ baseRef, root }) => {
  const mergeBase = runGit({
    args: ['merge-base', baseRef, 'HEAD'],
    cwd: root,
  });
  if (mergeBase === undefined || mergeBase === '') {
    throw new Error(
      `cannot resolve a merge base with '${baseRef}'. Fetch it (\`git fetch origin\`), or in CI check out with fetch-depth: 0.`,
    );
  }
  return mergeBase;
};

export const readChanges = ({ mergeBase, root }) => [
  ...parseNameStatus(
    gitOrThrow(['diff', '--name-status', '-z', '-M', mergeBase], root),
  ),
  ...untrackedChanges(
    gitOrThrow(['ls-files', '-z', '--others', '--exclude-standard'], root),
  ),
];

const toManifest = (dir, text) => {
  const manifest = JSON.parse(text);
  return {
    dir,
    name: manifest.name,
    private: manifest.private === true,
    version: manifest.version,
  };
};

const headDirs = (root, workspaceDir) =>
  existsSync(join(root, workspaceDir))
    ? readdirSync(join(root, workspaceDir), { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => `${workspaceDir}/${entry.name}`)
    : [];

const headManifests = (root, workspaceDirs) =>
  workspaceDirs
    .flatMap((workspaceDir) => headDirs(root, workspaceDir))
    .filter((dir) => existsSync(join(root, dir, 'package.json')))
    .map((dir) =>
      toManifest(dir, readFileSync(join(root, dir, 'package.json'), 'utf8')),
    );

const baseManifests = ({ mergeBase, root, workspaceDirs }) =>
  workspaceDirs
    .flatMap((workspaceDir) =>
      (
        runGit({
          args: ['ls-tree', '--name-only', `${mergeBase}:${workspaceDir}`],
          cwd: root,
        }) ?? ''
      )
        .split('\n')
        .filter((name) => name !== '')
        .map((name) => `${workspaceDir}/${name}`),
    )
    .map((dir) => ({
      dir,
      text: runGit({
        args: ['show', `${mergeBase}:${dir}/package.json`],
        cwd: root,
      }),
    }))
    .filter(({ text }) => text !== undefined)
    .map(({ dir, text }) => toManifest(dir, text));

export const readManifests = ({ mergeBase, root }) => {
  const { workspaceDirs } = readPublishing(root);
  return {
    base: baseManifests({ mergeBase, root, workspaceDirs }),
    head: headManifests(root, workspaceDirs),
  };
};

const packedFiles = (directory) => {
  const destination = mkdtempSync(join(tmpdir(), 'changeset-pack-'));
  try {
    return new Set(packAndRead({ destination, directory }).files);
  } finally {
    rmSync(destination, { force: true, recursive: true });
  }
};

const withoutDependencies = (manifestText) =>
  `${JSON.stringify(
    Object.fromEntries(
      Object.entries(JSON.parse(manifestText)).filter(
        ([field]) => !DEPENDENCY_FIELDS.has(field),
      ),
    ),
    undefined,
    2,
  )}\n`;

const basePackedFiles = ({ dir, mergeBase, root }) => {
  const scratch = mkdtempSync(join(tmpdir(), 'changeset-gate-'));
  try {
    gitOrThrow(
      [
        `--work-tree=${scratch}`,
        'restore',
        `--source=${mergeBase}`,
        '--worktree',
        '--',
        dir,
      ],
      root,
    );
    const manifestPath = join(scratch, dir, 'package.json');
    writeFileSync(
      manifestPath,
      withoutDependencies(readFileSync(manifestPath, 'utf8')),
    );
    return packedFiles(join(scratch, dir));
  } finally {
    rmSync(scratch, { force: true, recursive: true });
  }
};

export const packerFor =
  ({ mergeBase, root }) =>
  ({ dir, side }) =>
    side === 'head'
      ? packedFiles(join(root, dir))
      : basePackedFiles({ dir, mergeBase, root });

export const readNamedPackages = async ({ changesetIds, root }) => {
  if (changesetIds.length === 0) {
    return new Set();
  }
  const { changesets } = await getReleasePlan(root);
  return new Set(
    changesets
      .filter(({ id }) => changesetIds.includes(id))
      .flatMap(({ releases }) => releases.map(({ name }) => name)),
  );
};
