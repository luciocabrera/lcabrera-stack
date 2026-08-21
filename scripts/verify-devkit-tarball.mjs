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
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import process from 'node:process';

import {
  binsWithoutShebang,
  binStartupFailure,
  declaredBins,
  failureLine,
  inertHooks,
  materialisationFailure,
  noCommandsDeclared,
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

const toPosix = (value) => value.replaceAll('\\', '/');

/** Every file devkit placed, ignoring the install it placed them beside. */
const materialisedFiles = (directory) =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === 'node_modules' || entry.name === '.git') return [];
    const path = join(directory, entry.name);
    return entry.isDirectory() ? materialisedFiles(path) : [path];
  });

/** One file out of a tarball, without unpacking the whole thing. */
const packedFileReader = (tarball) => (target) => {
  try {
    return run('tar', ['-xzOf', tarball, `package/${target}`], REPO_ROOT);
  } catch {
    return undefined;
  }
};

/**
 * Pack with pnpm, not npm: `publishConfig` and `catalog:` are pnpm rewrites.
 *
 * The manifest comes back OUT of the tarball rather than off disk, which is the
 * whole point of packing. pnpm substitutes `publishConfig` at pack time, so a
 * package using the built shape has `exports` pointing at `./src/*` on disk and
 * `./dist/*` in the artifact — comparing the on-disk map against the packed files
 * would report every export missing while the artifact is fine, and, more quietly,
 * would report green for a subpath present in `exports` and forgotten in
 * `publishConfig.exports`. `publish-pack.mjs` reads it back for the same reason.
 */
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

  const packed = packedFileReader(tarball)('package.json');
  if (packed === undefined) {
    throw new Error(`the tarball for packages/${directory} holds no manifest`);
  }
  return { manifest: JSON.parse(packed), tarball };
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
  // `full`, not `agent`, and with a command map: the narrower profile carries no
  // hooks and no workflows, so this gate ran over a set that could not exhibit
  // either failure those files have — an inert hook, and a placeholder nobody
  // answered. The commands are npm's because npm is what installs this scratch
  // consumer; any complete map would do, and an incomplete one leaves the files
  // that need it unwritten.
  writeFileSync(
    join(root, 'devkit.config.json'),
    `${JSON.stringify(
      {
        commands: {
          audit: 'npm audit --audit-level moderate',
          check: 'npm run check',
          install: 'npm ci',
          test: 'npm test',
        },
        profile: 'full',
      },
      undefined,
      2,
    )}\n`,
  );
  return root;
};

/** The hooks directory this scratch consumer's config leaves at its default. */
const HOOKS_PATH = '.githooks';

/** Owner, group or other — any of them is what git accepts as executable. */
const EXECUTABLE_BITS = 0o111;

const materialisedModes = (consumer) =>
  materialisedFiles(consumer).map((path) => ({
    executable: (statSync(path).mode & EXECUTABLE_BITS) !== 0,
    path: toPosix(relative(consumer, path)),
  }));

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

/** One consumer-side command, as a finding rather than as an exception. */
const consumerStepFailure = ({ args, bin, consumer }) => {
  try {
    run(bin, args, consumer);
    return [];
  } catch (error) {
    const output = `${error.stdout ?? ''}${error.stderr ?? ''}`.trim();
    const detail = output === '' ? error.message : failureLine(output);
    return [`\`devkit ${args.join(' ')}\` failed in the consumer: ${detail}`];
  }
};

/**
 * Whether the kit actually placed anything, read from its own record.
 *
 * Asserted rather than assumed: the success line used to claim `devkit sync`
 * materialised while nothing here had checked it, and a kit that placed every
 * file produced identical output to one that placed none.
 */
const materialisedFailure = (consumer) => {
  const manifestPath = join(consumer, '.devkit-manifest.json');
  const manifest = existsSync(manifestPath)
    ? JSON.parse(readFileSync(manifestPath, 'utf8'))
    : {};
  const failure = materialisationFailure({
    manifestFiles: manifest.files,
    presentPaths: materialisedFiles(consumer).map((path) =>
      toPosix(relative(consumer, path)),
    ),
  });
  return failure === undefined ? [] : [failure];
};

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

    const contents = packed.flatMap(({ manifest, tarball }) => [
      ...tarballFindings({
        manifest,
        packedPaths: packedPathsOf(tarball),
      }).map((finding) => finding.detail),
      // Checked against the tarball rather than the working tree: the shebang
      // has to be in what a consumer receives, not merely in what we edited.
      ...binsWithoutShebang({
        manifest,
        readPackedFile: packedFileReader(tarball),
      }),
    ]);

    run(
      'npm',
      ['install', '--no-audit', '--no-fund', ...packed.map((p) => p.tarball)],
      consumer,
    );

    const bins = packed.flatMap(({ manifest }) => [
      ...(noCommandsDeclared(manifest) === undefined
        ? []
        : [noCommandsDeclared(manifest)]),
      ...binFailures({ consumer, manifest }),
    ]);
    const ran = packed.reduce(
      (total, { manifest }) => total + declaredBins(manifest).length,
      0,
    );

    // Each consumer-side step is collected rather than thrown, so one broken
    // command still yields the whole report. A gate that dies on its first
    // finding tells you less than one that lists them: the crash is a stack
    // trace where the answer should be.
    const devkitBin = join(consumer, 'node_modules', '.bin', 'devkit');
    const materialised = [
      ...consumerStepFailure({ args: ['sync'], bin: devkitBin, consumer }),
      ...consumerStepFailure({
        args: ['closure', '--shipped'],
        bin: devkitBin,
        consumer,
      }),
      ...survivingPlaceholders(consumer),
      ...materialisedFailure(consumer),
      ...inertHooks({
        hooksPath: HOOKS_PATH,
        materialised: materialisedModes(consumer),
      }),
    ];

    const findings = [...contents, ...bins, ...materialised];
    if (findings.length > 0) {
      process.stderr.write(
        `\nPacked-tarball gate — ${findings.length} finding(s):\n\n`,
      );
      report(findings);
      process.exitCode = 1;
      return;
    }

    const placed = Object.keys(
      JSON.parse(readFileSync(join(consumer, '.devkit-manifest.json'), 'utf8'))
        .files,
    ).length;

    process.stdout.write(
      `Packed-tarball gate passed: ${packed.length} package(s) packed, installed into a scratch repository, ${ran} declared bin(s) ran, and \`devkit sync\` placed ${placed} file(s).\n`,
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
