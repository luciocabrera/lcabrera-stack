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
import { runGitStatus } from '../../packages/repo-standards/scripts/git-exec.mjs';
import { packAndRead } from '../../packages/repo-standards/scripts/publish-pack.mjs';
import {
  changedChangesetIds,
  missingChangesets,
  packageTouches,
  parseNameStatus,
  untrackedChanges,
} from './changeset-required.mjs';

const DEPENDENCY_FIELDS = new Set([
  'bundleDependencies',
  'bundledDependencies',
  'dependencies',
  'devDependencies',
  'optionalDependencies',
  'peerDependencies',
]);

export const systemGit = (root) => (args) => {
  const { status, stderr, stdout } = runGitStatus({ args, cwd: root });
  if (status !== 0) {
    const detail = stderr === '' ? '' : ': ' + stderr;
    throw new Error(
      `\`git ${args.join(' ')}\` failed${detail} — refusing to report a pass on data it could not read.`,
    );
  }
  return stdout;
};

const GIT_REF = /^[\w@{}^~][\w./@{}^~-]*$/u;

const checkedRef = (baseRef) => {
  if (!GIT_REF.test(baseRef)) {
    throw new Error(
      `the base ${JSON.stringify(baseRef)} is not a git ref or commit; it must start with a letter, digit or underscore and hold no spaces.`,
    );
  }
  return baseRef;
};

const resolveMergeBase = ({ baseRef, git }) => {
  const mergeBase = git(['merge-base', checkedRef(baseRef), 'HEAD']).trim();
  if (mergeBase === '') {
    throw new Error(`\`git merge-base ${baseRef} HEAD\` printed no commit.`);
  }
  return mergeBase;
};

const readChanges = ({ git, mergeBase }) => [
  ...parseNameStatus(git(['diff', '--name-status', '-z', '-M', mergeBase])),
  ...untrackedChanges(
    git(['ls-files', '-z', '--others', '--exclude-standard']),
  ),
];

const nulList = (output) => output.split('\0').filter((entry) => entry !== '');

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

const baseManifests = ({ git, mergeBase, workspaceDirs }) => {
  const dirs = workspaceDirs.flatMap((workspaceDir) =>
    nulList(
      git([
        'ls-tree',
        '-z',
        '-d',
        '--name-only',
        mergeBase,
        '--',
        `${workspaceDir}/`,
      ]),
    ),
  );
  if (dirs.length === 0) {
    return [];
  }
  const manifestPaths = nulList(
    git([
      'ls-tree',
      '-z',
      '--name-only',
      mergeBase,
      '--',
      ...dirs.map((dir) => `${dir}/package.json`),
    ]),
  );
  return manifestPaths.map((path) =>
    toManifest(
      path.slice(0, -'/package.json'.length),
      git(['show', `${mergeBase}:${path}`]),
    ),
  );
};

const readManifests = ({ git, mergeBase, root }) => {
  const { workspaceDirs } = readPublishing(root);
  return {
    base: baseManifests({ git, mergeBase, workspaceDirs }),
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

const basePackedFiles = ({ dir, git, mergeBase }) => {
  const scratch = mkdtempSync(join(tmpdir(), 'changeset-gate-'));
  try {
    git([
      `--work-tree=${scratch}`,
      'restore',
      `--source=${mergeBase}`,
      '--worktree',
      '--',
      dir,
    ]);
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

const packerFor =
  ({ git, mergeBase, root }) =>
  ({ dir, side }) =>
    side === 'head'
      ? packedFiles(join(root, dir))
      : basePackedFiles({ dir, git, mergeBase });

const readNamedPackages = async ({ changesetIds, root }) => {
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

export const findMissing = async ({ baseRef, gitRunner, root }) => {
  const git = gitRunner ?? systemGit(root);
  const mergeBase = resolveMergeBase({ baseRef, git });
  const changes = readChanges({ git, mergeBase });
  const manifests = readManifests({ git, mergeBase, root });
  const namedPackages = await readNamedPackages({
    changesetIds: changedChangesetIds(changes),
    root,
  });
  return missingChangesets({
    manifests,
    namedPackages,
    pack: packerFor({ git, mergeBase, root }),
    touches: packageTouches({ changes, manifests }),
  });
};
