/**
 * Reading the ranges this repository ships: every data file under the devkit
 * assets, every range constant listed in `RANGE_CONSTANTS`, and the versions
 * the publishable workspaces are on. `shipped-ranges:verify` judges what this
 * reads and `shipped-ranges:raise` raises it, so both read the same set (ADR-117).
 */

import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join, relative, sep } from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

import { readPublishableManifests } from '../../packages/repo-standards/scripts/publishable-workspaces.mjs';
import {
  catalogRanges,
  constantRanges,
  manifestRanges,
  sourceOf,
} from './shipped-ranges.mjs';
import { floorRaises, withRaisedFloors } from './shipped-floors.mjs';

const RANGE_CONSTANTS = [
  { constant: 'TOOLCHAIN_RANGES', path: 'packages/devkit/scripts/create.mjs' },
];

const toPosix = (path) => path.split(sep).join('/');

const shippedFiles = (assetsDir) =>
  readdirSync(assetsDir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => join(entry.parentPath, entry.name));

/**
 * @param {string} root
 */
export const assetSources = (root) =>
  shippedFiles(join(root, 'packages', 'devkit', 'assets')).flatMap((path) => {
    const source = sourceOf(basename(path));
    if (source === undefined) return [];

    return [
      {
        ...source,
        path: toPosix(relative(root, path)),
        text: readFileSync(path, 'utf8'),
      },
    ];
  });

const EXPORT_READER = [
  'const [url, name] = process.argv.slice(1);',
  'const value = (await import(url))[name];',
  'process.stdout.write(JSON.stringify(value ?? null));',
].join('\n');

const exportedValue = ({ absolute, constant }) => {
  const result = spawnSync(
    process.execPath,
    [
      '--input-type=module',
      '--eval',
      EXPORT_READER,
      pathToFileURL(absolute).href,
      constant,
    ],
    { encoding: 'utf8' },
  );
  if (result.status !== 0) {
    throw new Error(
      `${absolute} could not be imported to read \`${constant}\`:\n${result.stderr}`,
    );
  }
  return JSON.parse(result.stdout);
};

const constantSource = ({ constant, path, root }) => {
  const absolute = join(root, path);
  const text = readFileSync(absolute, 'utf8');
  const ranges = exportedValue({ absolute, constant });
  if (typeof ranges !== 'object' || ranges === null) {
    throw new TypeError(
      `${path} exports no \`${constant}\` object — the constant moved or was renamed, so the ranges it held are no longer read by this gate`,
    );
  }
  return {
    constant,
    kind: 'constant',
    path,
    ranges,
    text,
  };
};

/**
 * @param {string} root
 */
export const constantSources = (root) =>
  RANGE_CONSTANTS.map((entry) => constantSource({ ...entry, root }));

/**
 * @param {{ constant?: string, kind: string, path: string,
 *           ranges?: Record<string, string>, text: string }} source
 */
export const declarationsIn = ({ constant, kind, path, ranges, text }) => {
  if (kind === 'constant') return constantRanges({ constant, path, ranges });
  if (kind === 'manifest') {
    return manifestRanges({ manifest: JSON.parse(text), path });
  }
  return kind === 'catalog' ? catalogRanges({ path, text }) : [];
};

/**
 * @param {string} root
 * @returns {Record<string, string>}
 */
export const publishedVersions = (root) =>
  Object.fromEntries(
    readPublishableManifests(root).map((manifest) => [
      manifest.name,
      manifest.version,
    ]),
  );

/**
 * @param {string} root
 * @returns {{ from: string, kind: string, name: string, path: string, to: string }[]}
 */
export const raiseShippedFloors = (root) => {
  const versions = publishedVersions(root);
  const sources = [...assetSources(root), ...constantSources(root)];
  const raised = [];

  for (const source of sources) {
    const declarations = declarationsIn(source);
    const next = withRaisedFloors({
      declarations,
      kind: source.kind,
      text: source.text,
      versions,
    });
    if (next === source.text) continue;

    writeFileSync(join(root, source.path), next);
    raised.push(
      ...floorRaises({ declarations, versions }).map(
        ({ declaration, raised: to }) => ({
          from: declaration.range,
          kind: source.kind,
          name: declaration.name,
          path: source.path,
          to,
        }),
      ),
    );
  }
  return raised;
};
