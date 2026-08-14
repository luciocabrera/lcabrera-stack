/**
 * Imports a packed package the way a consumer would, from outside this repo
 * (scripts/verify-publish-surface.mjs).
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

/**
 * Writes one packed package into `<work>/node_modules/<name>`, and reports any
 * entry that would land outside it.
 *
 * An escaping path is refused rather than written — but refusing it quietly
 * would leave a tarball that writes over its neighbours looking like a healthy
 * one, which is this gate's own failure mode wearing a different hat. Nothing
 * this repo packs can produce one, so a report here means something upstream of
 * pnpm's packer has gone wrong and the run should stop.
 */
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
  const packed = new Map(packages.map((entry) => [entry.name, entry]));

  // Transitive, not one level: a package can depend on a packed sibling that
  // itself needs a registry dependency, and a direct-only check calls that
  // self-contained and then dies in the consumer on an import it cannot
  // resolve. `seen` stops a dependency cycle from recursing forever — a cycle
  // among packed packages needs nothing fetched, so it is contained.
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

/**
 * A package that contributes no specifier is packed, installed, and then not
 * exercised at all — the lane reports a number that says nothing.
 *
 * Reachable the moment a package's every subpath becomes a wildcard or a linked
 * asset, which is a manifest edit away and not currently true of any of them.
 * "Not currently true of any of them" is exactly the state `publish:verify` was
 * in while every package happened to be built, so this is a failure rather than
 * a quiet zero. An asset-only public package would be a legitimate reason to
 * import nothing; it has to be decided here, out loud, not inferred from a
 * count of zero.
 */
export const unimportableProblems = (smoked) =>
  smoked
    .filter(({ specifiers }) => specifiers.length === 0)
    .map(
      ({ packed }) =>
        `${packed.name}: packed with its whole dependency closure, yet not one published subpath could be imported — every one is a wildcard, a linked asset or the manifest. Packing it proved nothing a consumer would notice.`,
    );

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
