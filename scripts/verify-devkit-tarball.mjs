/**
 * Packs the distributed packages, installs them into a repository that holds
 * none of this one's files, and checks that what a consumer receives actually
 * works.
 *
 * Why it cannot be done in place: every workspace here consumes these packages
 * as `workspace:*`, which resolves the source directory and ignores `files`
 * entirely. So the packed artifact — the only thing a consumer ever sees — is
 * exercised by nothing in this repository, and a wrong `files` list is invisible
 * until someone installs it. `@repo/devkit` shipped its whole test suite that
 * way. The scratch directory is under the OS temp root for the same reason: one
 * inside this tree, or inside a worktree of it, inherits the parent's
 * `node_modules` and root config and reports a success it has not earned.
 *
 * The deciding half is `./lib/devkit-tarball.mjs` (pure); this file is the
 * packing, the installing, the executing and the exit code.
 *
 * Usage: node scripts/verify-devkit-tarball.mjs
 * Exit codes: 0 = a consumer would get a working install, 1 = they would not.
 */

import { execFileSync } from 'node:child_process';
import {
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import process from 'node:process';

import {
  binStartupFailure,
  declaredBins,
  tarballFindings,
} from './lib/devkit-tarball.mjs';

const REPO_ROOT = process.cwd();

/** The packages a consumer installs. Their directories, not their npm names. */
const DISTRIBUTED = ['devkit', 'repo-standards'];

const run = (command, args, cwd) =>
  execFileSync(command, args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));

/** Every file devkit placed, ignoring the install it placed them beside. */
const materialisedFiles = (directory) =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === 'node_modules' || entry.name === '.git') return [];
    const path = join(directory, entry.name);
    return entry.isDirectory() ? materialisedFiles(path) : [path];
  });

/** Pack with pnpm, not npm: `publishConfig` and `catalog:` are pnpm rewrites. */
const packOne = ({ directory, into }) => {
  const packageDir = join(REPO_ROOT, 'packages', directory);
  const output = run('pnpm', ['pack', '--pack-destination', into], packageDir);
  const tarball = output
    .split('\n')
    .map((line) => line.trim())
    .findLast((line) => line.endsWith('.tgz'));

  if (tarball === undefined) {
    throw new Error(`pnpm pack produced no tarball for packages/${directory}`);
  }
  return { manifest: readJson(join(packageDir, 'package.json')), tarball };
};

const packedPathsOf = (tarball) =>
  run('tar', ['-tzf', tarball], REPO_ROOT)
    .split('\n')
    .filter((line) => line !== '' && !line.endsWith('/'))
    .map((line) => line.replace(/^package\//, ''));

/** A git repository with a foreign remote, holding nothing of this one. */
const scratchConsumer = () => {
  const root = mkdtempSync(join(tmpdir(), 'devkit-tarball-'));
  run('git', ['init', '-q', '.'], root);
  run(
    'git',
    ['remote', 'add', 'origin', 'https://example.invalid/x/y.git'],
    root,
  );
  writeFileSync(
    join(root, 'package.json'),
    `${JSON.stringify({ name: 'consumer', private: true, type: 'module', version: '1.0.0' }, undefined, 2)}\n`,
  );
  writeFileSync(join(root, 'devkit.config.json'), '{ "profile": "agent" }\n');
  return root;
};

/** Each declared bin, executed by name through the consumer's own resolution. */
const binFailures = ({ consumer, manifest }) =>
  declaredBins(manifest).flatMap(({ name }) => {
    let output = '';
    let spawned = true;
    try {
      output = run(
        join(consumer, 'node_modules', '.bin', name),
        ['--help'],
        consumer,
      );
    } catch (error) {
      output = `${error.stdout ?? ''}${error.stderr ?? ''}`;
      spawned = error.code !== 'ENOENT' && output.trim() !== '';
    }
    const failure = binStartupFailure({ name, output, spawned });
    return failure === undefined ? [] : [`${manifest.name}: ${failure}`];
  });

/** Nothing the consumer received may still carry an unanswered placeholder. */
const survivingPlaceholders = (consumer) =>
  materialisedFiles(consumer)
    .filter((path) => readFileSync(path, 'utf8').includes('{{commands.'))
    .map(
      (path) =>
        `\`${relative(consumer, path)}\` still carries a {{commands.*}} placeholder`,
    );

const report = (findings) => {
  for (const finding of findings) process.stderr.write(`  • ${finding}\n`);
  process.stderr.write(
    '\nThis is what a consumer installs. Everything here resolves from the\nworkspace and is ignored at pack time, so only a packed tarball can answer.\n',
  );
};

const main = () => {
  const staging = mkdtempSync(join(tmpdir(), 'devkit-pack-'));
  const consumer = scratchConsumer();

  try {
    const packed = DISTRIBUTED.map((directory) =>
      packOne({ directory, into: staging }),
    );

    const contents = packed.flatMap(({ manifest, tarball }) =>
      tarballFindings({ manifest, packedPaths: packedPathsOf(tarball) }).map(
        (finding) => finding.detail,
      ),
    );

    run(
      'npm',
      ['install', '--no-audit', '--no-fund', ...packed.map((p) => p.tarball)],
      consumer,
    );

    const bins = packed.flatMap(({ manifest }) =>
      binFailures({ consumer, manifest }),
    );

    const devkitBin = join(consumer, 'node_modules', '.bin', 'devkit');
    run(devkitBin, ['sync'], consumer);

    // The materialised tree has to survive its own closure probe, and hold no
    // placeholder nobody answered — both are consumer-side failures this
    // repository cannot see, because it has every path a shipped file names.
    const materialised = [];
    try {
      run(devkitBin, ['closure', '--shipped'], consumer);
    } catch (error) {
      materialised.push(
        `devkit closure --shipped failed in the consumer: ${`${error.stdout ?? ''}${error.stderr ?? ''}`.trim().split('\n').at(-1)}`,
      );
    }
    materialised.push(...survivingPlaceholders(consumer));

    const findings = [...contents, ...bins, ...materialised];
    if (findings.length > 0) {
      process.stderr.write(
        `\nPacked-tarball gate — ${findings.length} finding(s):\n\n`,
      );
      report(findings);
      process.exitCode = 1;
      return;
    }

    process.stdout.write(
      `Packed-tarball gate passed: ${packed.length} package(s) packed, installed into a scratch repository, every declared bin ran, and \`devkit sync\` materialised.\n`,
    );
  } finally {
    rmSync(staging, { force: true, recursive: true });
    rmSync(consumer, { force: true, recursive: true });
  }
};

try {
  main();
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
}
