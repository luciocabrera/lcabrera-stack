/**
 * Imports a packed package the way a consumer would, from outside this repo
 * (scripts/verify-publish-surface.mjs).
 *
 * Every other check reads a manifest and reasons about it. This one lays the
 * packed tarballs out as `node_modules` in a temporary directory and has a
 * fresh Node process import each published subpath, so the answer comes from
 * the module resolver rather than from the gate's own model of it. A tarball
 * whose `exports` still point at `src` fails here with the very error the
 * manifest exists to prevent — see ADR-072.
 *
 * Only packages whose runtime dependencies are all in the packed set can be
 * imported without a registry; the caller refuses a run that smoke-tests none.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

import { collectTargets } from './publish-surface.mjs';

/**
 * Assets a consumer links rather than imports. Everything else is attempted,
 * deliberately including a `.ts` target: that is the failure this gate is for,
 * and skipping what does not look importable would skip exactly it.
 */
const ASSET_EXTENSIONS = ['.css', '.json', '.svg', '.txt', '.md'];

/** True when the entry stays inside the package root once resolved. */
const isContained = ({ path, root }) => {
  const inside = relative(root, resolve(root, path));
  return inside.length > 0 && !inside.startsWith('..');
};

/** Writes one packed package into `<work>/node_modules/<name>`. */
const install = ({ nodeModules, packed }) => {
  const root = join(nodeModules, packed.name);
  for (const file of packed.files.filter((path) =>
    isContained({ path, root }),
  )) {
    const destination = join(root, file);
    mkdirSync(dirname(destination), { recursive: true });
    writeFileSync(destination, packed.readFile(file));
  }
};

/** A subpath a consumer can `import` — concrete, and resolving to a module. */
const isImportable = ([subpath, target]) =>
  subpath !== './package.json' &&
  !subpath.includes('*') &&
  collectTargets(target).some(
    (path) => !ASSET_EXTENSIONS.some((extension) => path.endsWith(extension)),
  );

/** The import specifiers a consumer of this package would write. */
export const importSpecifiers = ({ manifest, name }) =>
  Object.entries(manifest.exports ?? {})
    .filter((entry) => isImportable(entry))
    .map(([subpath]) => `${name}${subpath.slice(1)}`);

/**
 * The packages whose whole runtime dependency closure is packed alongside them,
 * so nothing has to be fetched from a registry to import one.
 */
export const selfContained = (packages) => {
  const packed = new Set(packages.map(({ name }) => name));
  return packages.filter(({ manifest }) =>
    Object.keys(manifest.dependencies ?? {}).every((dependency) =>
      packed.has(dependency),
    ),
  );
};

/** Variables through which the parent could inject modules into the consumer. */
const AMBIENT_RESOLUTION_VARIABLES = new Set(['NODE_OPTIONS', 'NODE_PATH']);

/** Node's resolver must see only what was installed, never an ambient path. */
const consumerEnvironment = () =>
  Object.fromEntries(
    Object.entries(process.env).filter(
      ([name]) => !AMBIENT_RESOLUTION_VARIABLES.has(name),
    ),
  );

/**
 * Installs every packed package into `workDirectory` and imports the subpaths
 * of the self-contained ones in a separate Node process.
 */
export const runConsumerSmoke = ({ packages, workDirectory }) => {
  const nodeModules = join(workDirectory, 'node_modules');
  for (const packed of packages) {
    install({ nodeModules, packed });
  }

  const smoked = selfContained(packages);
  const specifiers = smoked.flatMap((packed) => importSpecifiers(packed));
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
    return { problems: [], smoked, specifiers };
  } catch (error) {
    const detail = String(error.stderr ?? error.message)
      .split('\n')
      .filter((line) => line.trim().length > 0)
      .slice(0, 6)
      .join('\n    ');
    return {
      problems: [
        `a consumer outside this repo could not import the packed tarballs (${smoked
          .map(({ name }) => name)
          .join(', ')}):\n    ${detail}`,
      ],
      smoked,
      specifiers,
    };
  }
};
