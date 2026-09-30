/**
 * Fails when a dependency range `packages/devkit` ships excludes the version
 * this repository publishes for that package, or the minor after it — a range
 * in a shipped asset, or one `devkit create` writes from `TOOLCHAIN_RANGES`.
 *
 * A bootstrapped repository installs from the registry, so a range in a shipped
 * asset is what decides which release it gets. Below 1.0.0 a caret admits no
 * minor at all, and nothing reports the drift: the asset stays valid, every
 * other gate stays green, and the created repository quietly runs an older
 * package. Background: #1129.
 *
 * The deciding half is `./lib/shipped-ranges.mjs` (pure); this file is the
 * reading, the printing and the exit code. See `.claude/rules/scripts.md`.
 *
 * Usage: node scripts/verify-shipped-ranges.mjs
 * Exit codes: 0 = every shipped range admits it, 1 = one does not, or nothing
 * shipped could be read.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { basename, join, relative, sep } from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

import { readPublishableManifests } from '../packages/repo-standards/scripts/publishable-workspaces.mjs';
import {
  catalogRanges,
  constantRanges,
  findingLine,
  manifestRanges,
  mentionsIn,
  shippedRangeFindings,
  sourceOf,
} from './lib/shipped-ranges.mjs';

const REPO_ROOT = process.cwd();
const ASSETS_DIR = join(REPO_ROOT, 'packages', 'devkit', 'assets');

const RANGE_CONSTANTS = [
  { constant: 'TOOLCHAIN_RANGES', path: 'packages/devkit/scripts/create.mjs' },
];

const constantSource = async ({ constant, path }) => {
  const exported = await import(pathToFileURL(join(REPO_ROOT, path)).href);
  const ranges = exported[constant];
  if (typeof ranges !== 'object' || ranges === null) {
    throw new TypeError(
      `${path} exports no \`${constant}\` object — the constant moved or was renamed, so the ranges it held are no longer read by this gate`,
    );
  }
  return { constant, kind: 'constant', path, ranges };
};

const shippedFiles = () =>
  readdirSync(ASSETS_DIR, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => join(entry.parentPath, entry.name));

const toPosix = (path) => path.split(sep).join('/');

const sourcesUnder = () =>
  shippedFiles().flatMap((path) => {
    const source = sourceOf(basename(path));
    if (source === undefined) return [];

    return [
      {
        ...source,
        path: toPosix(relative(REPO_ROOT, path)),
        text: readFileSync(path, 'utf8'),
      },
    ];
  });

const declarationsIn = ({ constant, kind, path, ranges, text }) => {
  if (kind === 'constant') return constantRanges({ constant, path, ranges });
  if (kind === 'manifest') {
    return manifestRanges({ manifest: JSON.parse(text), path });
  }
  return kind === 'catalog' ? catalogRanges({ path, text }) : [];
};

const publishedVersions = () =>
  Object.fromEntries(
    readPublishableManifests(REPO_ROOT).map((manifest) => [
      manifest.name,
      manifest.version,
    ]),
  );

const main = async () => {
  const assets = sourcesUnder();
  const constants = await Promise.all(RANGE_CONSTANTS.map(constantSource));
  const sources = [...assets, ...constants];
  const versions = publishedVersions();
  const names = Object.keys(versions);

  const declarations = sources.flatMap(declarationsIn);
  const mentions = assets.flatMap(({ hashComments, path, text }) =>
    mentionsIn({ hashComments, names, path, text }),
  );

  const findings = shippedRangeFindings({
    declarations,
    mentions,
    sources,
    versions,
  });

  for (const finding of findings) {
    console.error(`  ${findingLine(finding)}`);
  }

  if (findings.length > 0) {
    console.error(
      '\nA shipped range decides which release a created repository installs, so it has to admit the one this repository publishes and the minor after it — and a file naming one of those packages has to yield a declaration this gate can judge.',
    );
    process.exitCode = 1;
    return;
  }

  const read = sources.filter(({ kind }) => kind !== 'scanned').length;

  console.log(
    `Shipped range gate passed: ${declarations.length} declaration(s) read from ${read} shipped source(s), out of ${sources.length} scanned for a package this repository publishes — ${mentions.length} mention(s), each one read.`,
  );
};

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
