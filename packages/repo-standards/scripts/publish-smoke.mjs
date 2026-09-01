/**
 * Imports a packed package the way a consumer would, from outside this repo
 * (verify-publish-surface.mjs).
 *
 * Every other check reads a manifest and reasons about it. This one lays the
 * packed tarballs out as `node_modules` in a temporary directory and has a
 * fresh Node process import each published subpath, so the answer comes from
 * the module resolver rather than from the gate's own model of it. A tarball
 * whose `exports` still point at `src` fails here with the very error the
 * manifest exists to prevent — see ADR-073.
 *
 * Only packages whose runtime dependencies are all in the packed set can be
 * imported without a registry; the caller refuses a run that smoke-tests none.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

import { collectTargets } from './publish-surface.mjs';

const ASSET_EXTENSIONS = ['.css', '.json', '.svg', '.txt', '.md'];

const isContained = ({ path, root }) => {
  const inside = relative(root, resolve(root, path));
  return inside.length > 0 && !inside.startsWith('..');
};

const install = ({ nodeModules, packed }) => {
  const root = join(nodeModules, packed.name);
  const [contained, escaping] = packed.files.reduce(
    ([inside, outside], path) =>
      isContained({ path, root })
        ? [[...inside, path], outside]
        : [inside, [...outside, path]],
    [[], []],
  );
  for (const file of contained) {
    const destination = join(root, file);
    mkdirSync(dirname(destination), { recursive: true });
    writeFileSync(destination, packed.readFile(file));
  }
  return escaping.map(
    (path) =>
      `${packed.name}: the packed tarball contains \`${path}\`, which resolves outside the package directory — it was not written, and a tarball that reaches its neighbours is not one to publish.`,
  );
};

const isImportable = ([subpath, target]) =>
  subpath !== './package.json' &&
  !subpath.includes('*') &&
  collectTargets(target).some(
    (path) => !ASSET_EXTENSIONS.some((extension) => path.endsWith(extension)),
  );

export const importSpecifiers = ({ manifest, name }) =>
  Object.entries(manifest.exports ?? {})
    .filter((entry) => isImportable(entry))
    .map(([subpath]) => `${name}${subpath.slice(1)}`);

export const selfContained = (packages) => {
  const packed = new Map(packages.map((entry) => [entry.name, entry]));

  const closureIsPacked = (entry, seen) =>
    Object.keys(entry.manifest.dependencies ?? {}).every((dependency) => {
      const packedDependency = packed.get(dependency);
      if (packedDependency === undefined) {
        return false;
      }
      if (seen.has(dependency)) {
        return true;
      }
      seen.add(dependency);
      return closureIsPacked(packedDependency, seen);
    });

  return packages.filter((entry) => closureIsPacked(entry, new Set()));
};

export const unimportableProblems = (smoked) =>
  smoked
    .filter(({ specifiers }) => specifiers.length === 0)
    .map(
      ({ packed }) =>
        `${packed.name}: packed with its whole dependency closure, yet not one published subpath could be imported — every one is a wildcard, a linked asset or the manifest. Packing it proved nothing a consumer would notice.`,
    );

const AMBIENT_RESOLUTION_VARIABLES = new Set(['NODE_OPTIONS', 'NODE_PATH']);

const consumerEnvironment = () =>
  Object.fromEntries(
    Object.entries(process.env).filter(
      ([name]) => !AMBIENT_RESOLUTION_VARIABLES.has(name),
    ),
  );

export const runConsumerSmoke = ({ packages, workDirectory }) => {
  const nodeModules = join(workDirectory, 'node_modules');
  const escaping = packages.flatMap((packed) =>
    install({ nodeModules, packed }),
  );

  const lanes = selfContained(packages).map((packed) => ({
    packed,
    specifiers: importSpecifiers(packed),
  }));
  const smoked = lanes.map((lane) => lane.packed);
  const specifiers = lanes.flatMap((lane) => lane.specifiers);
  const empty = [...escaping, ...unimportableProblems(lanes)];
  const entry = join(workDirectory, 'consumer.mjs');
  const lines = specifiers.map(
    (specifier) => `await import(${JSON.stringify(specifier)});`,
  );
  writeFileSync(entry, `${lines.join('\n')}\n`);

  try {
    execFileSync(process.execPath, [entry], {
      cwd: workDirectory,
      encoding: 'utf8',
      env: consumerEnvironment(),
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { problems: empty, smoked, specifiers };
  } catch (error) {
    const detail = String(error.stderr ?? error.message)
      .split('\n')
      .filter((line) => line.trim().length > 0)
      .slice(0, 6)
      .join('\n    ');
    return {
      problems: [
        ...empty,
        `a consumer outside this repo could not import the packed tarballs (${smoked
          .map(({ name }) => name)
          .join(', ')}):\n    ${detail}`,
      ],
      smoked,
      specifiers,
    };
  }
};
