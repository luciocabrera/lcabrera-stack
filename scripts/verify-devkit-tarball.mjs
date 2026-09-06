/**
 * Packs the distributed packages, installs them into a repository that holds
 * none of this one's files, and checks that what a consumer receives actually
 * works.
 *
 * Why it cannot be done in place: every workspace here consumes these packages
 * as `workspace:*`, which resolves the source directory and ignores `files`
 * entirely. So the packed artifact — the only thing a consumer ever sees — is
 * exercised by nothing in this repository, and a wrong `files` list is invisible
 * until someone installs it. `@lcabrera/devkit` shipped its whole test suite that
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
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import process from 'node:process';

import {
  binsWithoutNodeFloor,
  binsWithoutShebang,
  binStartupFailure,
  declaredBins,
  failureLine,
  gateProbeFindings,
  inertHooks,
  materialisationFailure,
  bareTaskFindings,
  clobberedConfigKeys,
  noCommandsDeclared,
  tarballFindings,
  taskFindings,
} from './lib/devkit-tarball.mjs';

const REPO_ROOT = process.cwd();

const DISTRIBUTED = ['devkit', 'repo-standards'];

const run = (command, args, cwd) =>
  execFileSync(command, args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

const toPosix = (value) => value.replaceAll('\\', '/');

const materialisedFiles = (directory) =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === 'node_modules' || entry.name === '.git') return [];
    const path = join(directory, entry.name);
    return entry.isDirectory() ? materialisedFiles(path) : [path];
  });

const packedFileReader = (tarball) => (target) => {
  try {
    return run('tar', ['-xzOf', tarball, `package/${target}`], REPO_ROOT);
  } catch {
    return undefined;
  }
};

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
  return root;
};

const HOOKS_PATH = '.githooks';

const initTaskFindings = (consumer) => {
  const binDir = join(consumer, 'node_modules', '.bin');
  return taskFindings({
    availableBins: existsSync(binDir) ? readdirSync(binDir) : [],
    scripts: JSON.parse(readFileSync(join(consumer, 'package.json'), 'utf8'))
      .scripts,
  });
};

const BARE_TASKS = [
  'adr:list',
  'adr:verify',
  'branch:verify',
  'coordination:verify',
  'devkit:check',
  'scripts:verify',
];

const bareTaskFailures = (consumer) =>
  BARE_TASKS.flatMap((name) => {
    try {
      run('npm', ['run', '--silent', name], consumer);
      return [];
    } catch (error) {
      const output = `${error.stdout ?? ''}${error.stderr ?? ''}`.trim();
      return [
        { detail: output === '' ? error.message : failureLine(output), name },
      ];
    }
  });

const reinitConfigFindings = (consumer) => {
  const path = join(consumer, 'devkit.config.json');
  const before = {
    ...JSON.parse(readFileSync(path, 'utf8')),
    gates: { strayConfigs: { unreadNames: ['.eslintignore'] } },
    publishing: { publicPackageDirs: ['ui'] },
  };
  writeFileSync(path, `${JSON.stringify(before, undefined, 2)}\n`);

  const failure = consumerStepFailure({
    args: ['init', '--force'],
    bin: join(consumer, 'node_modules', '.bin', 'devkit'),
    consumer,
  });
  if (failure.length > 0) return failure;

  return clobberedConfigKeys({
    after: JSON.parse(readFileSync(path, 'utf8')),
    before,
  });
};

const OVERSIZED_LINES = 400;

const oversizedScript = () =>
  `${Array.from(
    { length: OVERSIZED_LINES },
    (_unused, index) => `export const value${index} = ${index};`,
  ).join('\n')}\n`;

const GATE_BINS = [
  {
    name: 'repo-verify-script-exits',
    plant: { file: 'planted-exit.mjs', source: 'process.exit(1);\n' },
  },
  {
    name: 'repo-verify-script-size',
    plant: { file: 'scripts/planted-oversized.ts', source: oversizedScript() },
  },
];

const runBin = ({ args = [], bin, consumer }) => {
  try {
    return { output: run(bin, args, consumer), spawned: true, status: 0 };
  } catch (error) {
    return {
      output: `${error.stdout ?? ''}${error.stderr ?? ''}`,
      spawned: error.code !== 'ENOENT',
      status: error.status ?? null,
    };
  }
};

const gateBinFailures = (consumer) =>
  GATE_BINS.flatMap(({ name, plant }) => {
    const bin = join(consumer, 'node_modules', '.bin', name);
    const clean = runBin({ bin, consumer });
    const plantedPath = join(consumer, plant.file);
    mkdirSync(dirname(plantedPath), { recursive: true });
    writeFileSync(plantedPath, plant.source);
    try {
      const planted = runBin({ bin, consumer });
      return gateProbeFindings({
        clean,
        name,
        planted,
        plantedFile: plant.file,
      });
    } finally {
      rmSync(plantedPath, { force: true });
    }
  });

const EXECUTABLE_BITS = 0o111;

const materialisedModes = (consumer) =>
  materialisedFiles(consumer).map((path) => ({
    executable: (statSync(path).mode & EXECUTABLE_BITS) !== 0,
    path: toPosix(relative(consumer, path)),
  }));

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
      ...binsWithoutShebang({
        manifest,
        readPackedFile: packedFileReader(tarball),
      }),
      ...binsWithoutNodeFloor(manifest),
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

    const devkitBin = join(consumer, 'node_modules', '.bin', 'devkit');
    const materialised = [
      ...consumerStepFailure({
        args: ['init', '--profile', 'full'],
        bin: devkitBin,
        consumer,
      }),
      ...initTaskFindings(consumer),
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
      ...reinitConfigFindings(consumer),
      ...bareTaskFindings({
        expected: BARE_TASKS,
        failures: bareTaskFailures(consumer),
        scripts: JSON.parse(
          readFileSync(join(consumer, 'package.json'), 'utf8'),
        ).scripts,
      }),
      ...gateBinFailures(consumer),
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
    const tasks = Object.keys(
      JSON.parse(readFileSync(join(consumer, 'package.json'), 'utf8'))
        .scripts ?? {},
    ).length;

    process.stdout.write(
      `Packed-tarball gate passed: ${packed.length} package(s) packed, installed into a scratch repository, ${ran} declared bin(s) ran, and \`devkit init\` set up a repository holding none of this — ${placed} file(s) placed, ${tasks} runnable task(s) wired, ${GATE_BINS.length} gate bin(s) proven against a planted violation.\n`,
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
